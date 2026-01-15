import { ConnectRouter, ConnectError, Code } from "@connectrpc/connect";
import { PriceService } from "./gen/price/v1/price_pb.js";
import { chromium, Browser, Page } from "playwright";
import { EventEmitter, once } from "node:events";

/** Parse price text like "113,770.25" or "113,77" into a number */
function parsePriceText(t: string | null): number | null {
  if (!t) return null;
  let s = t.replace(/[^\d.,]/g, "").trim();
  if (!s) return null;
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
  s = s.replace(/(\d),(?=\d{3}\b)/g, "$1");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Simple async broadcaster -> many subscribers can consume an async iterator */
class AsyncBroadcaster<T> {
  private ee = new EventEmitter();
  publish(value: T) {
    this.ee.emit("data", value);
  }
  // Async iterator for a subscriber
  subscribe(): AsyncIterable<T> {
    const ee = this.ee;
    return (async function* () {
      const queue: T[] = [];
      const on = (v: T) => queue.push(v);
      ee.on("data", on);
      try {
        while (true) {
          if (queue.length === 0) {
            await once(ee, "data");
          }
          while (queue.length) {
            yield queue.shift()!;
          }
        }
      } finally {
        ee.off("data", on);
      }
    })();
  }
}

let sharedBrowser: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch({ headless: false });
  }
  return sharedBrowser;
}

type Tick = { symbol: string; price: number };

class Watcher {
  private page: Page | null = null;
  private running = false;
  private lastPrice: number | null = null;
  private readonly bus = new AsyncBroadcaster<Tick>();
  private refCount = 0;

  constructor(readonly symbol: string) {}

  addRef() {
    this.refCount++;
  }
  async release() {
    this.refCount--;
    if (this.refCount <= 0) {
      await this.stop();
    }
  }

  async start() {
    if (this.running) return;
    this.running = true;

    const browser = await getBrowser();
    this.page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    // Save bandwidth
    await this.page.route("**/*", (route) => {
      const t = route.request().resourceType();
      if (t === "image" || t === "font" || t === "media") return route.abort();
      return route.continue();
    });

    const url = `https://www.tradingview.com/symbols/${this.symbol}/?exchange=BINANCE`;
    console.log("[Watcher] start", this.symbol, url);
    await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await this.page.waitForLoadState("networkidle", { timeout: 30_000 });

    // DOM selector: pick the numeric span (not the "USD" one)
    const header = this.page.locator(
      `[data-symbol="BINANCE:${this.symbol}"].js-symbol-header-ticker`
    );
    const priceSpan = header
      .locator('span[translate="no"]')
      .filter({ hasText: /[0-9]/ })
      .first();

    // Poll
    (async () => {
      try {
        while (this.running) {
          let text: string | null = null;
          try {
            text = await priceSpan.textContent({ timeout: 2_000 });
          } catch {
            // ignore and retry
          }
          const price = parsePriceText(text);
          if (price != null && price !== this.lastPrice) {
            this.lastPrice = price;
            this.bus.publish({ symbol: this.symbol, price });
          }
          await new Promise((r) => setTimeout(r, 2_000));
        }
      } catch (e) {
        console.error("[Watcher] loop error", e);
      }
    })();
  }

  async stop() {
    if (!this.running) return;
    this.running = false;
    console.log("[Watcher] stop", this.symbol);
    await this.page?.close().catch(() => {});
    this.page = null;
  }

  subscribe(): AsyncIterable<Tick> {
    return this.bus.subscribe();
  }
}

// One watcher per symbol
const hub = new Map<string, Watcher>();
function getOrCreateWatcher(symbol: string): Watcher {
  let w = hub.get(symbol);
  if (!w) {
    w = new Watcher(symbol);
    hub.set(symbol, w);
  }
  return w;
}

export default (router: ConnectRouter) =>
  router.service(PriceService, {
    async *streamPrice(req) {
      // Accept BTCUSD / ETHUSD / SOLUSD ... (BINANCE pairs)
      const symbol = (req.symbol ?? "BTCUSD").toUpperCase();

      const watcher = getOrCreateWatcher(symbol);
      watcher.addRef();
      await watcher.start();

      const iter = watcher.subscribe();
      try {
        for await (const tick of iter) {
          // stream to this client
          yield tick;
        }
      } finally {
        await watcher.release();
      }
    },
  });
