"use client";

import { Search, Star } from "lucide-react";
import { useState } from "react";
import { categories } from "../lib/categories";
import { Sheet } from "./Sheet";

export function CategoryPickerSheet({
  value,
  onSelect,
  onClose,
  suggestions = [],
}: {
  value: string | null;
  onSelect: (category: string) => void;
  onClose: () => void;
  suggestions?: string[];
}) {
  const [search, setSearch] = useState("");
  const visible = [...new Set([...suggestions, ...categories.map((item) => item.name)])]
    .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    .map((name) => categories.find((item) => item.name === name))
    .filter((item): item is (typeof categories)[number] => Boolean(item));
  return <Sheet title="Choose category" onClose={onClose}>
    <div className="glass mb-5 flex items-center gap-2 rounded-2xl px-4"><Search size={18} className="text-[#8E8E93]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" className="w-full bg-transparent py-3 text-white outline-none placeholder:text-[#8E8E93]" /></div>
    <div className="grid grid-cols-2 gap-3">{visible.map(({ name, icon: Icon }) => <button type="button" key={name} onClick={() => { onSelect(name); onClose(); }} className={`glass flex items-center gap-3 rounded-2xl p-4 text-left transition-transform duration-150 active:scale-[0.96] ${value === name ? "ring-1 ring-white/50" : ""}`}><Icon size={19} />{name}{suggestions.includes(name) && <Star size={14} className="ml-auto text-[#FFD60A]" aria-label="Suggested" />}</button>)}</div>
  </Sheet>;
}
