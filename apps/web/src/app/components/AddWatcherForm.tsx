"use client";
import { useState } from "react";

export function AddWatcherForm({ onAdd }: { onAdd: (symbol: string) => void }) {
  const [val, setVal] = useState("");

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const s = val.trim().toUpperCase();
        if (s) {
          onAdd(s);
          setVal("");
        }
      }}
    >
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="BTCUSD, ETHUSD, SOLUSD…"
        className="flex-1 border rounded-xl px-3 py-2"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-xl bg-black text-white"
      >
        + Watch
      </button>
    </form>
  );
}
