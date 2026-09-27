"use client";

import { createElement, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Transaction } from "../lib/types";
import { categoryIcon } from "../lib/categories";

export function TransactionCard({ transaction, groupColor, onDetail, onLongPress }: {
  transaction: Transaction;
  groupColor?: string;
  onDetail: () => void;
  onLongPress: (position: { x: number; y: number }) => void;
}) {
  const credit = transaction.type === "credit";
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const [wave, setWave] = useState<{ x: number; y: number; key: number } | null>(null);
  useEffect(() => () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
  }, []);
  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    longPressed.current = false;
    const point = { x: event.clientX, y: event.clientY };
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      onLongPress(point);
    }, 550);
  };
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    setWave({ x: event.clientX ? event.clientX - bounds.left : bounds.width / 2, y: event.clientY ? event.clientY - bounds.top : bounds.height / 2, key: Date.now() });
    openTimer.current = setTimeout(onDetail, 520);
  };
  return <button type="button" onClick={handleClick} onPointerDown={handlePointerDown} onPointerUp={clearPress} onPointerLeave={clearPress} onPointerCancel={clearPress} onContextMenu={(event) => event.preventDefault()} className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-1 py-2.5 text-left active:scale-[0.99] ${transaction.excludedFromCashFlow ? "opacity-50" : ""}`}>
    {groupColor && <span aria-label="Grouped transaction" className="pointer-events-none absolute right-0 top-0 h-6 w-6" style={{ backgroundColor: groupColor, clipPath: "polygon(100% 0, 100% 100%, 0 0)" }} />}
    {wave && <span key={wave.key} className="transaction-wave" style={{ left: wave.x, top: wave.y }} />}
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3b3b3d] text-[#d9d9d9]">{createElement(categoryIcon(transaction.category), { size: 20 })}</span>
    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-white">{transaction.merchant || "Unknown"}</span><span className="block truncate text-[10px] text-[#8e8e93]">{transaction.category || "Other"}</span></span>
    <strong className={`relative z-10 shrink-0 text-[13px] font-semibold ${credit ? "text-(--green)" : "text-(--red)"}`}>₹ {Number(transaction.amount).toLocaleString("en-IN")}</strong>
  </button>;
}
