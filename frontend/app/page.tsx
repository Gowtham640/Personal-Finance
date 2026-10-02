"use client";

import { ArrowUp, Ban, ChevronDown, FolderPlus, GitBranch, Plus, RefreshCw, Search, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { DivideTransactionSheet } from "../components/DivideTransactionSheet";
import { GroupPickerSheet } from "../components/GroupPickerSheet";
import { CategoryPickerSheet } from "../components/CategoryPickerSheet";
import { AddTransactionSheet } from "../components/AddTransactionSheet";
import { AuthGate } from "../components/AuthGate";
import { ProfileMenu } from "../components/ProfileMenu";
import { TransactionCard } from "../components/TransactionCard";
import { TransactionDetailSheet } from "../components/TransactionDetailSheet";
import { useAuth } from "../hooks/useAuth";
import { useCategories } from "../hooks/useCategories";
import { useSources } from "../hooks/useSources";
import { useGroups } from "../hooks/useGroups";
import { useTransactions } from "../hooks/useTransactions";
import { getMeta, listCategoryMappings, putCategoryMapping, replaceTransactionWithSplits, setMeta } from "../lib/db";
import { groupColor } from "../lib/group-colors";
import { categoryFrequency, categorySuggestion, CategoryMapping, orderedCategorySuggestions } from "../lib/merchant-intelligence";
import { syncData } from "../lib/sync";
import { Transaction } from "../lib/types";

function transactionTime(transaction: Transaction) {
  const primary = Date.parse(transaction.email_timestamp ?? transaction.transaction_date);
  if (Number.isFinite(primary)) return primary;
  const fallback = Date.parse(transaction.created_at);
  return Number.isFinite(fallback) ? fallback : 0;
}

function welcomeName(email: string) {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._+-]/).find(Boolean) ?? local;
  return first ? first[0].toUpperCase() + first.slice(1) : "there";
}

const money = (value: number) => "₹ " + value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function Home() {
  const [sheet, setSheet] = useState<"add" | "category" | "detail" | "divide" | "group" | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceId, setSourceId] = useState("overall");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [longPressMenu, setLongPressMenu] = useState<{ transaction: Transaction; x: number; y: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping>({});
  const { user, setUser, loading } = useAuth();
  const { sources } = useSources();
  const { groups, create: createGroup, rename: renameGroup, remove: removeGroup } = useGroups(user?.id);
  const { categories, create: createCategory, rename: renameCategory, remove: removeCategory } = useCategories(user?.id);
  const { transactions, update } = useTransactions();
  const categoryIconKeys = useMemo(() => new Map(categories.map((item) => [`${item.type}:${item.name.toLowerCase()}`, item.icon_key])), [categories]);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      listCategoryMappings(user.id),
      getMeta<CategoryMapping>("merchant_category_mappings"),
    ]).then(([records, legacy]) => {
      const next = { ...(legacy ?? {}), ...Object.fromEntries(records.map((item) => [item.merchant_key, item.category])) };
      setCategoryMappings(next);
      void Promise.all(Object.entries(legacy ?? {}).map(([merchantKey, category]) => putCategoryMapping({
        id: user.id + ":" + merchantKey, user_id: user.id, merchant_key: merchantKey, category,
        updated_at: new Date().toISOString(), sync_status: "pending",
      })));
    });
  }, [user]);

  const ownedSources = useMemo(() => sources.filter((item) => item.user_id === user?.id), [sources, user?.id]);
  const selectedSource = ownedSources.find((item) => item.id === sourceId);
  const sourceTransactions = useMemo(() => transactions.filter((item) =>
    item.user_id === user?.id && (!selectedSource ||
      item.source?.toLowerCase() === selectedSource.source_name.toLowerCase() ||
      (selectedSource.source_name.toLowerCase() === "upi" && !item.source))
  ), [transactions, user?.id, selectedSource]);
  const sortedTransactions = useMemo(() => [...sourceTransactions].sort((left, right) =>
    transactionTime(right) - transactionTime(left) || right.updated_at.localeCompare(left.updated_at)
  ), [sourceTransactions]);
  const currentMonth = new Date();
  const monthly = sourceTransactions.filter((item) => {
    const date = new Date(item.transaction_date);
    return !item.excludedFromCashFlow && date.getFullYear() === currentMonth.getFullYear() && date.getMonth() === currentMonth.getMonth();
  });
  const incoming = monthly.filter((item) => item.type === "credit").reduce((sum, item) => sum + Number(item.amount), 0);
  const outgoing = monthly.filter((item) => item.type === "debit").reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = selectedSource ? Number(selectedSource.balance) : ownedSources.reduce((sum, item) => sum + Number(item.balance), 0);
  const visibleTransactions = sortedTransactions.filter((item) => !searchQuery.trim() ||
    [item.merchant, item.category, item.amount, item.description, item.source].some((value) => String(value ?? "").toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );
  const datedTransactions = Object.entries(visibleTransactions.reduce<Record<string, Transaction[]>>((groups, item) => {
    const date = item.transaction_date.slice(0, 10);
    (groups[date] ??= []).push(item);
    return groups;
  }, {})).sort(([left], [right]) => right.localeCompare(left));

  const openSheet = (next: typeof sheet) => { setQuickOpen(false); setSheet(next); };
  const refresh = async () => {
    setRefreshing(true);
    try { await syncData(); window.dispatchEvent(new Event("expense-data-changed")); }
    finally { setRefreshing(false); }
  };
  const learnCategory = (merchant: string, category: string) => {
    const key = merchant.trim().toLowerCase();
    const next = { ...categoryMappings, [key]: category };
    setCategoryMappings(next);
    void setMeta("merchant_category_mappings", next);
    if (user) void putCategoryMapping({
      id: user.id + ":" + key, user_id: user.id, merchant_key: key, category,
      updated_at: new Date().toISOString(), sync_status: "pending",
    });
  };
  const editCategory = async (category: string) => {
    if (!selected) return;
    await update({ ...selected, category, sync_status: "pending", updated_at: new Date().toISOString() });
    if (selected.merchant) learnCategory(selected.merchant, category);
    setSelected(null);
    setSheet(null);
  };
  const addToGroup = async (groupId: string | null) => {
    if (!selected) return;
    await update({ ...selected, group_id: groupId, sync_status: "pending", updated_at: new Date().toISOString() });
    setSelected(null);
    setSheet(null);
  };
  const divideTransaction = async (amounts: number[]) => {
    if (!selected) return;
    const timestamp = Date.now();
    const splits = amounts.map((amount, index) => ({
      ...selected, id: crypto.randomUUID(), unique_ref: selected.unique_ref + "-split-" + timestamp + "-" + (index + 1),
      amount, sync_status: "pending" as const, updated_at: new Date().toISOString(),
    }));
    await replaceTransactionWithSplits(selected.id, splits);
    window.dispatchEvent(new Event("expense-data-changed"));
    setSelected(null);
    setSheet(null);
  };
  const selectedSuggestions = selected ? orderedCategorySuggestions(
    categoryFrequency(transactions),
    categorySuggestion(selected.merchant ?? "", selected.amount, selected.type, categoryMappings),
    categories.filter((item) => item.type === selected.type).map((item) => item.name),
  ) : [];

  return <AuthGate user={user} loading={loading}><main className="mx-auto min-h-screen max-w-md overflow-x-hidden bg-[#111112] px-5 pb-28 pt-[calc(2rem+env(safe-area-inset-top))]">
    <header className="mb-5 flex items-center justify-between">
      <h1 className="text-[18px] font-semibold">Welcome, {user?.display_name?.trim() || welcomeName(user?.email ?? "")}</h1>
      <ProfileMenu user={user} onChange={setUser} />
    </header>

    <section className="relative h-[210px] overflow-visible rounded-[20px] bg-cover bg-center px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,.3)]" style={{ backgroundImage: "url('/image%201.svg')" }} aria-label="Balance summary">
      <div className="relative">
        <button type="button" aria-expanded={sourceOpen} onClick={() => setSourceOpen((value) => !value)} className="flex items-center gap-1 text-[15px] font-medium text-white/90">{selectedSource?.source_name ?? "Overall"} <ChevronDown size={16} /></button>
        {sourceOpen && <div className="absolute left-0 top-7 z-20 min-w-36 rounded-xl border border-white/15 bg-[#29252e] p-1 shadow-xl">
          <button type="button" onClick={() => { setSourceId("overall"); setSourceOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-[15px] hover:bg-white/10">Overall</button>
          {ownedSources.map((source) => <button type="button" key={source.id} onClick={() => { setSourceId(source.id); setSourceOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-[15px] hover:bg-white/10">{source.source_name}</button>)}
        </div>}
      </div>
      <div className="absolute inset-x-0 top-[70px] text-center text-[36px] font-semibold tracking-tight">{money(balance)}</div>
      <div className="absolute inset-x-4 bottom-3 grid grid-cols-2 gap-3">
        <span className="min-w-0 text-[14px]">Incoming:<strong className="block truncate text-[17px] text-(--green)">{money(incoming)}</strong></span>
        <span className="min-w-0 text-right text-[14px]">Outgoing:<strong className="block truncate text-[17px] text-(--red)">{money(outgoing)}</strong></span>
      </div>
    </section>

    <section className={"mt-6 transition-[filter,opacity] duration-300 " + (quickOpen ? "pointer-events-none blur-[3px] opacity-65" : "")}>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-[20px] font-semibold">Recent Transactions</h2><div className="flex gap-1">
        <button type="button" aria-label="Search transactions" onClick={() => setSearchOpen((value) => !value)} className="rounded-full p-2 text-white/55"><Search size={20} /></button>
        <button type="button" aria-label="Refresh transactions" onClick={() => void refresh()} disabled={refreshing} className="rounded-full p-2 text-white/55 disabled:opacity-40"><RefreshCw size={20} className={refreshing ? "animate-spin" : ""} /></button>
      </div></div>
      {searchOpen && <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" className="finance-field mb-3" style={{ fontSize: 16 }} />}
      <div>{datedTransactions.map(([date, items], index) => <section key={date} className={index < datedTransactions.length - 1 ? "mb-4" : ""}>
        <h3 className="mb-2 text-[12px] font-normal text-[#8e8e93]">{new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</h3>
        <div className="space-y-1">{items.map((item) => <TransactionCard key={item.id} transaction={item} iconKey={categoryIconKeys.get(`${item.type}:${item.category?.toLowerCase()}`)} groupColor={item.group_id ? groupColor(item.group_id) : undefined}
          onDetail={() => { setSelected(item); openSheet("detail"); }}
          onCategory={() => { setSelected(item); openSheet("category"); }}
          onLongPress={({ x, y }) => setLongPressMenu({ transaction: item, x: Math.min(x, document.documentElement.clientWidth - 232), y: Math.min(y, document.documentElement.clientHeight - 168) })}
        />)}</div>
      </section>)}</div>
      {visibleTransactions.length === 0 && <p className="py-12 text-center text-[16px] text-white/45">No transactions yet.</p>}
    </section>

    <BottomNav />
    {quickOpen && <button type="button" aria-label="Close quick actions" className="fixed inset-0 z-20 cursor-default" onClick={() => setQuickOpen(false)} />}
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-5 z-30 flex flex-col items-end gap-2">
      {quickOpen && <div className="mb-1 flex flex-col items-end gap-2">
        {[{ label: "Group", target: "group" as const, delay: 140 }, { label: "Category", target: "category" as const, delay: 70 }, { label: "Transaction", target: "add" as const, delay: 0 }].map((action) =>
          <button key={action.target} type="button" onClick={() => { setSelected(null); openSheet(action.target); }} className="quick-action min-w-24 rounded-full bg-[#e5e5e5] px-4 py-2 text-center text-[15px] font-medium text-black shadow-lg" style={{ animationDelay: action.delay + "ms" }}>{action.label}</button>
        )}
      </div>}
      <button type="button" aria-label={quickOpen ? "Close add menu" : "Open add menu"} aria-expanded={quickOpen} onClick={() => setQuickOpen((value) => !value)} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e5e5e5] text-black shadow-lg transition-transform duration-200 active:scale-95">{quickOpen ? <ArrowUp size={24} /> : <Plus size={27} />}</button>
    </div>

    {sheet === "add" && <AddTransactionSheet sources={ownedSources} month={currentMonth} transactions={transactions} categoryMappings={categoryMappings} userId={user?.id ?? ""} onLearnCategory={learnCategory} onClose={() => setSheet(null)} categories={categories} onCreateCategory={createCategory} onRenameCategory={renameCategory} onDeleteCategory={removeCategory} />}
    {sheet === "category" && <CategoryPickerSheet value={selected?.category ?? null} type={selected?.type} suggestions={selectedSuggestions} records={categories} onSelect={selected ? editCategory : undefined} onCreate={createCategory} onRename={renameCategory} onDelete={removeCategory} onClose={() => setSheet(null)} />}
    {sheet === "detail" && selected && <TransactionDetailSheet transaction={selected} transactions={transactions} categoryMappings={categoryMappings} onLearnCategory={learnCategory} onSave={update} onClose={() => setSheet(null)} categories={categories} onCreateCategory={createCategory} onRenameCategory={renameCategory} onDeleteCategory={removeCategory} />}
    {sheet === "divide" && selected && <DivideTransactionSheet transaction={selected} onSave={divideTransaction} onClose={() => setSheet(null)} />}
    {sheet === "group" && <GroupPickerSheet groups={groups} currentGroupId={selected?.group_id ?? null} onSelect={selected ? (groupId) => { void addToGroup(groupId); } : undefined} onCreate={createGroup} onRename={renameGroup} onDelete={removeGroup} onClose={() => { setSelected(null); setSheet(null); }} />}

    {longPressMenu && <><button type="button" aria-label="Close transaction actions" className="fixed inset-0 z-40" onClick={() => setLongPressMenu(null)} /><div className="fixed z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#2c2c2e] p-1 shadow-2xl" style={{ left: longPressMenu.x, top: longPressMenu.y }}>
      <button type="button" onClick={async () => { const item = longPressMenu.transaction; await update({ ...item, excludedFromCashFlow: !item.excludedFromCashFlow, sync_status: "pending", updated_at: new Date().toISOString() }); setLongPressMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm hover:bg-white/10">{longPressMenu.transaction.excludedFromCashFlow ? <Undo2 size={16} /> : <Ban size={16} />}{longPressMenu.transaction.excludedFromCashFlow ? "Include in cash flow" : "Exclude from cash flow"}</button>
      <button type="button" onClick={() => { setSelected(longPressMenu.transaction); openSheet("group"); setLongPressMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm hover:bg-white/10"><FolderPlus size={16} />Add to group</button>
      <button type="button" onClick={() => { setSelected(longPressMenu.transaction); openSheet("divide"); setLongPressMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm hover:bg-white/10"><GitBranch size={16} />Divide transaction</button>
    </div></>}
  </main></AuthGate>;
}
