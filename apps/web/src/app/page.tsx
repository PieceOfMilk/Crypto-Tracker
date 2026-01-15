"use client";

import { useState } from "react";
import { AddWatcherForm } from "@/app/components/AddWatcherForm";
import { WatcherCard } from "@/app/components/WatcherCard";

export default function Page() {
  const [symbols, setSymbols] = useState<string[]>(["BTCUSD"]);

  const addSymbol = (s: string) => {
  setSymbols((prev) =>
    prev.includes(s)
      ? prev
      : [...prev, s].sort((a, b) => a.localeCompare(b))
    );
  };

  const removeSymbol = (s: string) => {
    setSymbols((prev) => prev.filter((x) => x !== s));
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Crypto Watchers</h1>
      <AddWatcherForm onAdd={addSymbol} />

      <div className="grid gap-4">
        {symbols
          .slice()
          .sort((a, b) => a.localeCompare(b))
          .map((s) => (
            <WatcherCard key={s} symbol={s} onRemove={() => removeSymbol(s)} />
          ))}
      </div>

    </main>
  );
}
