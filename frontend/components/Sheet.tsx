"use client";

import { X } from "lucide-react";

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="sheet-backdrop fixed inset-0 z-50 flex items-end bg-black/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="sheet glass max-h-[92vh] w-full overflow-y-auto rounded-t-3xl p-6">
      <div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button aria-label="Close" onClick={onClose} className="rounded-full p-2 text-[#8E8E93] hover:bg-white/10"><X size={20} /></button></div>
      {children}
    </section>
  </div>;
}
