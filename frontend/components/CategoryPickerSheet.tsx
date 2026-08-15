"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { categories } from "../lib/categories";
import { Sheet } from "./Sheet";

export function CategoryPickerSheet({ value, onSelect, onClose }: { value: string | null; onSelect: (category: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const visible = categories.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  return <Sheet title="Choose category" onClose={onClose}>
    <div className="glass mb-5 flex items-center gap-2 rounded-2xl px-4"><Search size={18} className="text-[#8E8E93]" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" className="w-full bg-transparent py-3 text-white outline-none placeholder:text-[#8E8E93]" /></div>
    <div className="grid grid-cols-2 gap-3">{visible.map(({ name, icon: Icon }) => <button key={name} onClick={() => { onSelect(name); onClose(); }} className={`glass flex items-center gap-3 rounded-2xl p-4 text-left transition-transform duration-150 active:scale-[0.96] ${value === name ? "ring-1 ring-white/50" : ""}`}><Icon size={19} />{name}</button>)}</div>
  </Sheet>;
}
