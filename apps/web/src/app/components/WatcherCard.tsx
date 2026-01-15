"use client";
import { usePriceStream } from "@/app/hooks/usePriceStream";

export function WatcherCard({ symbol, onRemove }: { symbol: string; onRemove: () => void }) {
  const { price, status } = usePriceStream(symbol);

  return (
    <div className="rounded-2xl p-4 shadow bg-white border flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">BINANCE / {symbol.toUpperCase()}</div>
        <div className="text-2xl font-semibold">
          {price != null ? price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
        </div>
        <div className="text-xs mt-1">
          {status === "connecting" && "Connecting…"}
          {status === "live" && "Live"}
          {status === "error" && "Error"}
          {status === "idle" && "Idle"}
        </div>
      </div>
      <button
        className="text-sm text-red-600 hover:underline"
        onClick={onRemove}
      >
        Remove
      </button>
    </div>
  );
}
