"use client";

import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { useState } from "react";
import { Source } from "../lib/types";
import { EditSourceSheet } from "./EditSourceSheet";

export function SourceIcon({ type, size = 19 }: { type: Source["icon_type"]; size?: number }) {
  if (type === "cash") return <Banknote size={size} />;
  if (type === "bank") return <Landmark size={size} />;
  if (type === "visa" || type === "mastercard") return <CreditCard size={size} />;
  return <Wallet size={size} />;
}

export function SourceCardsScroller({ sources, onSave }: { sources: Source[]; onSave: (source: Source) => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null);
  return <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scroll-behavior:smooth]">{sources.map((source) => <button type="button" key={source.id} onClick={() => setEditing(source.id)} className="glass min-w-[calc(50%-8px)] snap-center rounded-3xl p-5 text-left"><div className="flex items-center gap-3 text-sm"><SourceIcon type={source.icon_type} /><span>{source.source_name}</span></div><div className="mt-5 text-2xl font-bold">₹{Number(source.balance).toLocaleString("en-IN")}</div></button>)}{editing && (() => { const source = sources.find((item) => item.id === editing); return source ? <EditSourceSheet source={source} onSave={onSave} onClose={() => setEditing(null)} /> : null; })()}</div>;
}
