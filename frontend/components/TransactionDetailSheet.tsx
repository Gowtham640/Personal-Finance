import { Sheet } from "./Sheet";
import { Transaction } from "../lib/types";

export function TransactionDetailSheet({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const rows = [["Merchant", transaction.merchant || "—"], ["Amount", `₹${transaction.amount.toLocaleString("en-IN")}`], ["Type", transaction.type], ["Category", transaction.category || "—"], ["Date", new Date(transaction.transaction_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })], ["Source", transaction.source || "—"], ["Balance after", transaction.balance_after == null ? "—" : `₹${transaction.balance_after.toLocaleString("en-IN")}`]];
  return <Sheet title="Transaction details" onClose={onClose}><div className="space-y-4">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-6 border-b border-white/10 pb-3 text-sm"><span className="text-[#8E8E93]">{label}</span><span className={label === "Amount" ? transaction.type === "credit" ? "text-[#30D158]" : "text-[#FF453A]" : "text-right"}>{value}</span></div>)}<div className="pt-2 text-xs text-[#8E8E93]"><p>Description: {transaction.description || "—"}</p><p className="mt-2">Reference: {transaction.unique_ref}</p></div></div></Sheet>;
}
