"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main navigation" className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-5 z-30 flex h-12 min-w-40 gap-1 rounded-full bg-[#5a5a5d] p-1 shadow-lg">
      {[{ href: "/", label: "Home", icon: "/home-tab.png" }, { href: "/analytics", label: "Analytics", icon: "/analytics-tab.png" }].map((item) => {
        const active = path === item.href;
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex flex-1 flex-col items-center justify-center rounded-full px-3 text-[12px] font-semibold text-white transition-all duration-200 active:scale-[0.96] ${active ? "bg-[#111112]" : ""}`}><Image src={item.icon} alt="" aria-hidden width={19} height={19} className="h-[19px] w-[19px] object-contain" /><span>{item.label}</span></Link>;
      })}
    </nav>
  );
}
