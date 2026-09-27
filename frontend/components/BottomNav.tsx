"use client";

import { ChartNoAxesCombined, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main navigation" className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-5 z-30 flex h-12 min-w-40 gap-1 rounded-full bg-[#a5a5a7] p-1 shadow-lg">
      {[{ href: "/", label: "Home", icon: House }, { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined }].map((item) => {
        const active = path === item.href;
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex flex-1 flex-col items-center justify-center rounded-full px-3 text-[12px] font-semibold transition-all duration-200 active:scale-[0.96] ${active ? "bg-white/30 text-[#0A84FF]" : "text-black"}`}><Icon size={19} fill={active ? "currentColor" : "none"} /><span>{item.label}</span></Link>;
      })}
    </nav>
  );
}
