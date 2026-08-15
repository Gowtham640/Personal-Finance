"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthSelector({ month, onChange }: { month: Date; onChange: (month: Date) => void }) {
  const now = new Date();
  const isCurrent = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  const label = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const move = (amount: number) => onChange(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  return <div className="flex items-center justify-center gap-5">
    <button aria-label="Previous month" onClick={() => move(-1)} className="rounded-full p-2 text-[#8E8E93] hover:bg-white/10"><ChevronLeft /></button>
    <label className="relative cursor-pointer text-3xl font-bold"><span>{label}</span><input aria-label="Choose month" type="month" value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`} max={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`} onChange={(event) => { if (event.target.value) { const [year, selectedMonth] = event.target.value.split("-").map(Number); onChange(new Date(year, selectedMonth - 1, 1)); } }} className="absolute inset-0 cursor-pointer opacity-0" /></label>
    <button aria-label="Next month" disabled={isCurrent} onClick={() => move(1)} className="rounded-full p-2 text-[#8E8E93] enabled:hover:bg-white/10 disabled:opacity-20"><ChevronRight /></button>
  </div>;
}
