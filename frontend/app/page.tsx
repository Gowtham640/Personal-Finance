"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { CategoryPickerSheet } from "../components/CategoryPickerSheet";
import { AddTransactionSheet } from "../components/AddTransactionSheet";
import { MonthSelector } from "../components/MonthSelector";
import { ProfileMenu } from "../components/ProfileMenu";
import { TransactionCard } from "../components/TransactionCard";
import { TransactionDetailSheet } from "../components/TransactionDetailSheet";
import { useAuth } from "../hooks/useAuth";
import { useSources } from "../hooks/useSources";
import { useTransactions } from "../hooks/useTransactions";
import { syncData } from "../lib/sync";
import { Transaction } from "../lib/types";

export default function Home() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [sheet, setSheet] = useState<"add" | "category" | "detail" | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user, setUser } = useAuth();
  const { sources } = useSources();
  const { transactions, update } = useTransactions();
  const monthTransactions = useMemo(() => transactions.filter((item) => { const date = new Date(item.transaction_date); return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(); }).sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)), [transactions, month]);
  const grouped = monthTransactions.reduce<Record<string, Transaction[]>>((acc, item) => { const key = item.transaction_date.slice(0, 10); (acc[key] ??= []).push(item); return acc; }, {});
  const incoming = monthTransactions.filter((item) => item.type === "credit").reduce((sum, item) => sum + item.amount, 0);
  const outgoing = monthTransactions.filter((item) => item.type === "debit").reduce((sum, item) => sum + item.amount, 0);
  const refreshLatestTransactions = async () => {
    setRefreshing(true);
    try {
      await syncData();
      window.dispatchEvent(new Event("expense-data-changed"));
    } finally {
      setRefreshing(false);
    }
  };
  const editCategory = async (category: string) => { if (selected) { await update({ ...selected, category, sync_status: "pending", updated_at: new Date().toISOString() }); setSelected(null); setSheet(null); } };
  return <main className="mx-auto min-h-screen max-w-2xl px-5 pb-32 pt-6">
    <header className="mb-12 flex justify-end"><ProfileMenu user={user} onChange={setUser} /></header>
    <section className="space-y-8">
      <MonthSelector month={month} onChange={setMonth} />
      <div className="glass flex items-center justify-between rounded-full px-6 py-4 text-sm"><span className="text-[#8E8E93]">Incoming: <strong className="text-[#30D158]">₹{incoming.toLocaleString("en-IN")}</strong></span><span className="text-[#8E8E93]">Outgoing: <strong className="text-[#FF453A]">₹{outgoing.toLocaleString("en-IN")}</strong></span></div>
      <div className="space-y-6">{Object.entries(grouped).map(([date, items]) => <section key={date}><div className="mb-3 flex items-center gap-3 text-sm font-semibold"><span>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span><div className="h-px flex-1 bg-white/10" /></div><div className="space-y-3">{items.map((item) => <TransactionCard key={item.id} transaction={item} onCategory={() => { setSelected(item); setSheet("category"); }} onDetail={() => { setSelected(item); setSheet("detail"); }} />)}</div></section>)}</div>
      {monthTransactions.length === 0 && <div className="py-24 text-center text-[#8E8E93]">No transactions for this month.</div>}
    </section>
    <div className="fixed bottom-24 right-5 z-30 flex items-center gap-3">
      <button aria-label="Refresh transactions" onClick={() => void refreshLatestTransactions()} disabled={refreshing} className="glass flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_0_24px_rgba(255,255,255,.1)] transition-transform duration-150 active:scale-[0.96] disabled:opacity-50">
        <RefreshCw size={18} className={refreshing ? "animate-spin" : undefined} />
      </button>
      <button aria-label="Add transaction" onClick={() => setSheet("add")} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-[0_0_24px_rgba(255,255,255,.1)] transition-transform duration-150 active:scale-[0.96]"><Plus size={22} /></button>
    </div>
    <BottomNav />
    {sheet === "add" && <AddTransactionSheet sources={sources} month={month} onClose={() => setSheet(null)} />}
    {sheet === "category" && selected && <CategoryPickerSheet value={selected.category} onSelect={editCategory} onClose={() => setSheet(null)} />}
    {sheet === "detail" && selected && <TransactionDetailSheet transaction={selected} onClose={() => setSheet(null)} />}
  </main>;
}
