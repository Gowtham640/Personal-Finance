"use client";

import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { useState } from "react";
import { Source } from "../lib/types";

function icon(type: Source["icon_type"]) {
  if (type === "cash") return Banknote;
  if (type === "bank") return Landmark;
  if (type === "visa" || type === "mastercard") return CreditCard;
  return Wallet;
}

export function SourceCardsScroller({ sources, onSave }: { sources: Source[]; onSave: (source: Source) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  return <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scroll-behavior:smooth]">{sources.map((source) => { const Icon = icon(source.icon_type); const active = editing === source.id; return <div key={source.id} className="glass min-w-[calc(50%-8px)] snap-center rounded-3xl p-5"><div className="flex items-center gap-3 text-sm"><Icon size={19} /><span>{source.source_name}</span></div>{active ? <input autoFocus type="number" value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => { onSave({ ...source, balance: Number(value) || 0, sync_status: "pending", updated_at: new Date().toISOString() }); setEditing(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className="mt-5 w-full bg-transparent text-2xl font-bold outline-none" /> : <button onClick={() => { setEditing(source.id); setValue(String(source.balance)); }} className="mt-5 text-2xl font-bold">₹{source.balance.toLocaleString("en-IN")}</button>}</div>; })}</div>;
}
