"use client";

import { Transaction } from "../lib/types";
import { Sheet } from "./Sheet";

export function CategoryTransactionsSheet({ category, transactions, type, onClose }: { category: string; transactions: Transaction[]; type: "debit" | "credit"; onClose: () => void }) {
  return <Sheet title={`${category} ${type === "credit" ? "income" : "spending"}`} onClose={onClose}>
    {transactions.length === 0 ? <p className="py-8 text-center text-sm text-[#8E8E93]">No transactions in this period.</p> : <div className="space-y-3">{transactions.map((transaction) => <div key={transaction.id} className="rounded-xl bg-white/5 p-3"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">{transaction.merchant || "Unknown"}</p><p className="mt-1 text-xs text-[#8E8E93]">{new Date(transaction.transaction_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></div><span className={`font-semibold ${transaction.type === "credit" ? "text-(--green)" : "text-(--red)"}`}>₹{Number(transaction.amount).toLocaleString("en-IN")}</span></div></div>)}</div>}
  </Sheet>;
}
