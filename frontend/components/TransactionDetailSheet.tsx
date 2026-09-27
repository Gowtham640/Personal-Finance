import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import { useSheetDraft } from "../hooks/useSheetDraft";
import { CategoryMapping, categoryFrequency, orderedCategorySuggestions } from "../lib/merchant-intelligence";
import { CategoryRecord, Transaction, TransactionType } from "../lib/types";
import { CategoryPickerSheet } from "./CategoryPickerSheet";
import { Sheet } from "./Sheet";

export function TransactionDetailSheet({
  transaction,
  transactions,
  categoryMappings,
  onLearnCategory,
  onSave,
  onClose,
  categories: categoryRecords,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
}: {
  transaction: Transaction;
  transactions: Transaction[];
  categoryMappings: CategoryMapping;
  onLearnCategory: (merchant: string, category: string) => void;
  onSave: (transaction: Transaction) => Promise<void>;
  onClose: () => void;
  categories: CategoryRecord[];
  onCreateCategory: (name: string, type: TransactionType) => Promise<boolean>;
  onRenameCategory: (category: CategoryRecord, name: string) => Promise<boolean>;
  onDeleteCategory: (category: CategoryRecord) => Promise<void>;
}) {
  const key = "edit-transaction-" + transaction.id + "-";
  const [editing, setEditing, clearEditing] = useSheetDraft(key + "mode", false);
  const [showCategories, setShowCategories] = useState(false);
  const [merchant, setMerchant, clearMerchant] = useSheetDraft(key + "merchant", transaction.merchant ?? "");
  const [amount, setAmount, clearAmount] = useSheetDraft(key + "amount", String(transaction.amount));
  const [type, setType, clearType] = useSheetDraft(key + "type", transaction.type);
  const [category, setCategory, clearCategory] = useSheetDraft(key + "category", transaction.category);
  const [date, setDate, clearDate] = useSheetDraft(key + "date", transaction.transaction_date.slice(0, 10));
  const [source, setSource, clearSource] = useSheetDraft(key + "source", transaction.source ?? "");
  const [description, setDescription, clearDescription] = useSheetDraft(key + "description", transaction.description ?? "");
  const [notes, setNotes, clearNotes] = useSheetDraft(key + "notes", transaction.notes ?? "");
  const [balanceAfter, setBalanceAfter, clearBalance] = useSheetDraft(key + "balance", transaction.balance_after == null ? "" : String(transaction.balance_after));
  const clearDraft = () => { clearEditing(); clearMerchant(); clearAmount(); clearType(); clearCategory(); clearDate(); clearSource(); clearDescription(); clearNotes(); clearBalance(); };
  const cancel = () => { clearDraft(); onClose(); };
  const suggestions = orderedCategorySuggestions(
    categoryFrequency(transactions),
    categoryMappings[merchant.trim().toLowerCase()] ?? null,
    categoryRecords.filter((item) => item.type === type).map((item) => item.name),
  );
  const save = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !date) return;
    const next: Transaction = {
      ...transaction,
      merchant: merchant.trim() || null,
      amount: numericAmount,
      type,
      category,
      transaction_date: new Date(`${date}T12:00:00`).toISOString(),
      source: source.trim() || null,
      description: description.trim() || null,
      notes: notes.trim() || null,
      balance_after: balanceAfter.trim() ? Number(balanceAfter) : null,
      updated_at: new Date().toISOString(),
      sync_status: "pending",
    };
    await onSave(next);
    if (next.merchant && next.category) onLearnCategory(next.merchant, next.category);
    clearDraft();
    setEditing(false);
    onClose();
  };
  if (!editing) {
    const rows = [["Merchant", transaction.merchant || "—"], ["Amount", `₹${transaction.amount.toLocaleString("en-IN")}`], ["Type", transaction.type], ["Category", transaction.category || "—"], ["Date", new Date(transaction.transaction_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })], ["Source", transaction.source || "—"], ["Balance after", transaction.balance_after == null ? "—" : `₹${transaction.balance_after.toLocaleString("en-IN")}`]];
    return <Sheet title="Transaction Details" onClose={onClose}><div className="space-y-3">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-6 border-b border-white/10 pb-2 text-xs"><span className="text-white/50">{label}</span><span className={label === "Amount" ? transaction.type === "credit" ? "text-(--green)" : "text-(--red)" : "text-right"}>{value}</span></div>)}<div className="pt-2 text-xs text-white/50"><p>Description: {transaction.description || "—"}</p><p className="mt-2">Note: {transaction.notes || "—"}</p><p className="mt-2">Reference: {transaction.unique_ref}</p></div><button type="button" onClick={() => setEditing(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white/15 p-3 text-xs font-medium"><Pencil size={15} />Edit transaction</button></div></Sheet>;
  }
  return <Sheet title="Edit Transaction" onClose={onClose} onCancel={cancel}>
    <div className="space-y-4">
      <label className="block text-xs text-white/75">Merchant / Description<input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="Merchant or counterparty" className="finance-field mt-1" /></label>
      <label className="block text-xs text-white/75">Amount<input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" className="finance-field mt-1" /></label>
      <div className="grid grid-cols-2 rounded-full bg-black/20 p-1">{(["credit", "debit"] as const).map((option) => <button key={option} onClick={() => setType(option)} className={`rounded-full py-2 text-sm capitalize ${type === option ? "bg-white/10 text-white" : "text-[#8E8E93]"}`}>{option}</button>)}</div>
      <label className="block text-xs text-white/75">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="finance-field mt-1" /></label>
      <label className="block text-xs text-white/75">Category<button type="button" onClick={() => setShowCategories(true)} className="finance-field mt-1 text-left">{category || "Choose category"}</button></label>
      <label className="block text-xs text-white/75">Source<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Source" className="finance-field mt-1" /></label>
      <label className="block text-xs text-white/75">Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="finance-field mt-1" /></label>
      <label className="block text-xs text-white/75">Note<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Note" className="finance-field mt-1 min-h-24" /></label>
      <label className="block text-xs text-white/75">Balance after<input type="number" step="0.01" value={balanceAfter} onChange={(event) => setBalanceAfter(event.target.value)} placeholder="Balance after (optional)" className="finance-field mt-1" /></label>
      <div className="grid grid-cols-2 gap-2 pt-2"><button type="button" onClick={cancel} className="rounded-full bg-white/10 py-2.5 text-xs">Cancel</button><button type="button" onClick={() => void save()} className="flex items-center justify-center gap-2 rounded-full bg-[#1e1e1f] py-2.5 text-xs"><Check size={15} />Save changes</button></div>
    </div>
    {showCategories && <CategoryPickerSheet value={category} type={type} suggestions={suggestions} records={categoryRecords} onSelect={setCategory} onCreate={onCreateCategory} onRename={onRenameCategory} onDelete={onDeleteCategory} onClose={() => setShowCategories(false)} />}
  </Sheet>;
}
