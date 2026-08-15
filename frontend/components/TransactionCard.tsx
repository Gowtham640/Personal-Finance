"use client";

import { createElement } from "react";
import { Transaction } from "../lib/types";
import { categoryIcon } from "../lib/categories";

export function TransactionCard({ transaction, onCategory, onDetail }: { transaction: Transaction; onCategory: () => void; onDetail: () => void }) {
  const credit = transaction.type === "credit";
  return <article onClick={onDetail} className={`glass rounded-3xl p-5 transition-transform duration-150 active:scale-[0.98] ${transaction.sync_status === "pending" ? "opacity-70" : ""}`}>
    <div className="text-sm"><span className="text-[#8E8E93]">{credit ? "From:" : "To:"}</span> <span className="font-medium">{transaction.merchant || "Unknown"}</span></div>
    <div className="my-4 border-t border-white/10" />
    <div className="flex items-center justify-between gap-4"><strong className={`text-xl ${credit ? "text-[#30D158]" : "text-[#FF453A]"}`}>{credit ? "+" : "−"}₹{transaction.amount.toLocaleString("en-IN")}</strong><button onClick={(event) => { event.stopPropagation(); onCategory(); }} className="flex w-fit items-center gap-2 rounded-full bg-[rgba(58,58,60,0.7)] px-3 py-2 text-xs text-white">{createElement(categoryIcon(transaction.category), { size: 15 })}{transaction.category || "Other"}</button></div>
  </article>;
}
