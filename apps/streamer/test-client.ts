import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { PriceService } from "./gen/price/v1/price_pb.js";

const transport = createConnectTransport({
    baseUrl: "http://localhost:8080",
    httpVersion: "1.1"
});

(async () => {
  const client = createClient(PriceService, transport);
  for await (const u of client.streamPrice({ symbol: "ETHUSD" })) {
    console.log("update:", u);
  }
})();
