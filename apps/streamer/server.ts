import * as http from "http";
import routes from "./connect.js";
import { connectNodeAdapter } from "@connectrpc/connect-node";

const handler = connectNodeAdapter({ routes });

http
  .createServer((req, res) => {
    // CORS for browser clients
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Connect-Protocol-Version");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    handler(req, res);
  })
  .listen(8080, () => console.log("✅ PriceService on http://localhost:8080"));
