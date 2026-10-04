"use client";

import { useMemo, useState } from "react";
import { useSheetDraft } from "../hooks/useSheetDraft";
import { putSource, putTransaction } from "../lib/db";
import { buildMerchantTrie, categoryFrequency, categorySuggestion, CategoryMapping, normalizeMerchant, orderedCategorySuggestions } from "../lib/merchant-intelligence";
import { CategoryRecord, Source, Transaction, TransactionType } from "../lib/types";
import { Sheet } from "./Sheet";
import { CategoryPickerSheet } from "./CategoryPickerSheet";

function todayForMonth(month: Date) {
  const today = new Date();
  const selected = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth() ? today : month;
  return selected.getFullYear() + "-" + String(selected.getMonth() + 1).padStart(2, "0") + "-" + String(selected.getDate()).padStart(2, "0");
}

export function AddTransactionSheet({
  sources, month, transactions, categoryMappings, userId, onLearnCategory, onClose,
  categories, onCreateCategory, onRenameCategory, onDeleteCategory,
}: {
  sources: Source[];
  month: Date;
  transactions: Transaction[];
  categoryMappings: CategoryMapping;
  userId: string;
  onLearnCategory: (merchant: string, category: string) => void;
  onClose: () => void;
  categories: CategoryRecord[];
  onCreateCategory: (name: string, type: TransactionType, iconKey: string) => Promise<boolean>;
  onRenameCategory: (category: CategoryRecord, name: string, iconKey: string) => Promise<boolean>;
  onDeleteCategory: (category: CategoryRecord) => Promise<void>;
}) {
  const [type, setType, clearType] = useSheetDraft<TransactionType>("add-transaction-type", "debit");
  const [sourceId, setSourceId, clearSource] = useSheetDraft("add-transaction-source", sources[0]?.id ?? "");
  const [category, setCategory, clearCategory] = useSheetDraft<string | null>("add-transaction-category", null);
  const [amount, setAmount, clearAmount] = useSheetDraft("add-transaction-amount", "");
  const [merchant, setMerchant, clearMerchant] = useSheetDraft("add-transaction-merchant", "");
  const [date, setDate, clearDate] = useSheetDraft("add-transaction-date", todayForMonth(month));
  const [showCategories, setShowCategories] = useState(false);
  const [error, setError] = useState("");
  const source = sources.find((item) => item.id === sourceId);
  const merchantTrie = useMemo(
    () => buildMerchantTrie(transactions, Object.keys(categoryMappings)),
    [categoryMappings, transactions],
  );
  const merchantSuggestions = useMemo(
    () => merchantTrie.suggest(merchant).filter((suggestion) => normalizeMerchant(suggestion) !== normalizeMerchant(merchant)),
    [merchant, merchantTrie],
  );
  const suggestedCategory = categorySuggestion(merchant, Number(amount), type, categoryMappings);
  const effectiveCategory = category ?? suggestedCategory ?? "Other";
  const suggestions = orderedCategorySuggestions(
    categoryFrequency(transactions), suggestedCategory,
    categories.filter((item) => item.type === type).map((item) => item.name),
  );
  const clearDraft = () => {
    clearType(); clearSource(); clearCategory(); clearAmount(); clearMerchant(); clearDate();
  };
  const cancel = () => { clearDraft(); onClose(); };
  const save = async () => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) { setError("Enter an amount greater than zero."); return; }
    if (!merchant.trim()) { setError("Enter a merchant or counterparty."); return; }
    if (!date) { setError("Choose a transaction date."); return; }
    if (!source && !userId) { setError("Choose a source before saving."); return; }
    try {
      const now = new Date().toISOString();
      const transaction: Transaction = {
        id: crypto.randomUUID(), user_id: source?.user_id ?? userId, unique_ref: "offline-" + Date.now(),
        transaction_date: new Date(date + "T12:00:00").toISOString(), amount: numeric, type,
        merchant: merchant.trim(), category: effectiveCategory, description: null, notes: null,
        balance_after: source ? Number(source.balance) + (type === "credit" ? numeric : -numeric) : null,
        source: source?.source_name ?? null, group_id: null, excludedFromCashFlow: false,
        created_at: now, updated_at: now, sync_status: "pending",
      };
      await putTransaction(transaction);
      if (source) await putSource({ ...source, balance: transaction.balance_after ?? source.balance, updated_at: now, sync_status: "pending" });
      if (category && merchant.trim()) onLearnCategory(merchant, category);
      window.dispatchEvent(new Event("expense-data-changed"));
      clearDraft();
      onClose();
    } catch (saveError) {
      console.error("Unable to save transaction", saveError);
      setError("Could not save this transaction. Please try again.");
    }
  };
  return <Sheet title="Add Transaction" onClose={onClose} onCancel={cancel}>
    <div className="space-y-3">
      <label className="block text-[11px] text-white/80">Merchant / Description
        <input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="e.g. Amazon, Swiggy, Salary" className="finance-field mt-1" />
      </label>
      {merchantSuggestions.length > 0 && <div className="max-h-28 overflow-y-auto rounded-lg bg-black/20 p-1">{merchantSuggestions.map((suggestion) =>
        <button type="button" key={suggestion} onClick={() => setMerchant(suggestion)} className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10">{suggestion}</button>
      )}</div>}
      <label className="block text-[11px] text-white/80">Amount
        <input type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" className="finance-field mt-1" />
      </label>
      <fieldset><legend className="mb-1 text-[11px] text-white/80">Transaction Type</legend>
        <div className="flex gap-1">{(["debit", "credit"] as const).map((option) => <button type="button" key={option} onClick={() => { setType(option); setCategory(null); }} className={`min-w-16 rounded-full border px-4 py-1.5 text-[11px] capitalize ${type === option ? "border-white/10 bg-[#777b7d]" : "border-white/15 bg-transparent text-white/65"}`}>{option}</button>)}</div>
      </fieldset>
      <label className="block text-[11px] text-white/80">Category
        <button type="button" onClick={() => setShowCategories(true)} className="finance-field mt-1 text-left">{effectiveCategory}</button>
      </label>
      <label className="block text-[11px] text-white/80">Source
        <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="finance-field mt-1">
          <option value="">Select source</option>{sources.map((item) => <option key={item.id} value={item.id}>{item.source_name}</option>)}
        </select>
      </label>
      <label className="block text-[11px] text-white/80">Date
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="finance-field mt-1" />
      </label>
      {error && <p role="alert" className="text-xs text-(--red)">{error}</p>}
      <div className="grid grid-cols-2 gap-2 pt-5">
        <button type="button" onClick={cancel} className="rounded-full bg-white/10 py-2.5 text-xs">Cancel</button>
        <button type="button" onClick={() => void save()} className="rounded-full bg-[#1e1e1f] py-2.5 text-xs font-medium">Add</button>
      </div>
    </div>
    {showCategories && <CategoryPickerSheet value={effectiveCategory} type={type} suggestions={suggestions} records={categories} onSelect={(value) => setCategory(value)} onCreate={onCreateCategory} onRename={onRenameCategory} onDelete={onDeleteCategory} onClose={() => setShowCategories(false)} />}
  </Sheet>;
}
