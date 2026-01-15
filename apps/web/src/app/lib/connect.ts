import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { PriceService } from "@/app/gen/price/v1/price_pb";

export function makePriceClient() {
  const transport = createConnectTransport({ baseUrl: "http://localhost:8080" });
  return createClient(PriceService, transport);
}
