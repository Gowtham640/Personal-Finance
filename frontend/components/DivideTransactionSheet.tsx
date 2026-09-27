"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useSheetDraft } from "../hooks/useSheetDraft";
import { Transaction } from "../lib/types";
import { Sheet } from "./Sheet";

export function DivideTransactionSheet({
  transaction,
  onSave,
  onClose,
}: {
  transaction: Transaction;
  onSave: (amounts: number[]) => Promise<void>;
  onClose: () => void;
}) {
  const [amounts, setAmounts, clearAmounts] = useSheetDraft("divide-" + transaction.id, [transaction.amount, 0]);
  const cancel = () => { clearAmounts(); onClose(); };
  const total = useMemo(() => amounts.reduce((sum, amount) => sum + (Number(amount) || 0), 0), [amounts]);
  const difference = Number((transaction.amount - total).toFixed(2));
  const updateAmount = (index: number, value: string) => {
    setAmounts((current) => current.map((amount, itemIndex) => itemIndex === index ? Number(value) || 0 : amount));
  };
  const save = async () => {
    if (amounts.length < 2 || difference !== 0 || amounts.some((amount) => amount <= 0)) return;
    await onSave(amounts);
    clearAmounts();
  };
  return <Sheet title="Divide Transaction" onClose={onClose} onCancel={cancel}>
    <p className="mb-4 text-sm text-[#8E8E93]">Original amount: ₹{transaction.amount.toLocaleString("en-IN")}</p>
    <div className="space-y-3">
      {amounts.map((amount, index) => <div key={index} className="flex items-center gap-2"><input aria-label={`Split amount ${index + 1}`} type="number" min="0.01" step="0.01" value={amount || ""} onChange={(event) => updateAmount(index, event.target.value)} className="finance-field" />{amounts.length > 2 && <button type="button" aria-label={`Remove split ${index + 1}`} onClick={() => setAmounts((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-full p-3 text-[#8E8E93] hover:bg-white/10"><Trash2 size={18} /></button>}</div>)}
    </div>
    <button type="button" onClick={() => setAmounts((current) => [...current, 0])} className="mt-4 flex items-center gap-2 text-sm text-[#8E8E93]"><Plus size={16} />Add another part</button>
    <div className={`mt-5 rounded-2xl p-4 text-sm ${difference === 0 ? "bg-[rgba(136,250,159,.1)] text-(--green)" : "bg-[rgba(250,136,136,.1)] text-(--red)"}`}>
      Total: ₹{total.toFixed(2)} {difference === 0 ? "matches the original" : `Remaining: ₹${difference.toFixed(2)}`}
    </div>
    <button type="button" disabled={difference !== 0 || amounts.some((amount) => amount <= 0)} onClick={() => void save()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"><Check size={16} />Save divided transactions</button>
  </Sheet>;
}
