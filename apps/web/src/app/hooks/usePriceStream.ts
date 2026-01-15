"use client";

import { useEffect, useRef, useState } from "react";
import { makePriceClient } from "@/app/lib/connect";

export function usePriceStream(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle"|"connecting"|"live"|"error">("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const client = makePriceClient();
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      try {
        setStatus("connecting");
        for await (const tick of client.streamPrice({ symbol }, { signal: ac.signal })) {
          setPrice(tick.price);
          setStatus("live");
        }
      } catch (e) {
        if (!ac.signal.aborted) {
          console.error("stream error", e);
          setStatus("error");
        }
      }
    })();

    return () => {
      ac.abort();
    };
  }, [symbol]);

  return { price, status };
}
