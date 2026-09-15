"use client";

import { Group, Transaction } from "../lib/types";
import { groupColor } from "../lib/group-colors";
import { Sheet } from "./Sheet";

function transactionTime(transaction: Transaction) {
  const primaryTimestamp = Date.parse(transaction.email_timestamp ?? transaction.transaction_date);
  if (Number.isFinite(primaryTimestamp)) return primaryTimestamp;
  const fallbackTimestamp = Date.parse(transaction.created_at);
  return Number.isFinite(fallbackTimestamp) ? fallbackTimestamp : 0;
}

export function GroupTransactionsSheet({ group, transactions, onClose }: { group: Group; transactions: Transaction[]; onClose: () => void }) {
  const orderedTransactions = [...transactions].sort((left, right) => transactionTime(right) - transactionTime(left) || right.updated_at.localeCompare(left.updated_at));

  return <Sheet title={`${group.name} transactions`} onClose={onClose}>
    {orderedTransactions.length === 0 ? <p className="py-8 text-center text-sm text-[#8E8E93]">No transactions in this group.</p> : <div className="space-y-3">{orderedTransactions.map((transaction) => <div key={transaction.id} className="glass relative overflow-hidden rounded-2xl p-4"><span aria-label="Grouped transaction" className="pointer-events-none absolute right-0 top-0 h-8 w-8" style={{ backgroundColor: groupColor(group.id), clipPath: "polygon(100% 0, 100% 100%, 0 0)" }} /><div className="flex items-center justify-between gap-4"><div><p className="font-medium">{transaction.merchant || "Unknown"}</p><p className="mt-1 text-xs text-[#8E8E93]">{new Date(transaction.transaction_date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p></div><span className={`font-semibold ${transaction.type === "credit" ? "text-[#30D158]" : "text-[var(--red)]"}`}>{transaction.type === "credit" ? "+" : "−"}₹{Number(transaction.amount).toLocaleString("en-IN")}</span></div><div className="mt-2 text-xs text-[#8E8E93]">{transaction.type === "credit" ? "Income" : "Spending"} · {transaction.category || "Other"}</div></div>)}</div>}
  </Sheet>;
}
