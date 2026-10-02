"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { AddSourceSheet } from "../../components/AddSourceSheet";
import { AnalyticsCharts } from "../../components/AnalyticsCharts";
import { AuthGate } from "../../components/AuthGate";
import { BottomNav } from "../../components/BottomNav";
import { CategoryTransactionsSheet } from "../../components/CategoryTransactionsSheet";
import { DateRangeSheet } from "../../components/DateRangeSheet";
import { GroupTransactionsSheet } from "../../components/GroupTransactionsSheet";
import { SourceCardsScroller } from "../../components/SourceCardsScroller";
import { useSources } from "../../hooks/useSources";
import { useTransactions } from "../../hooks/useTransactions";
import { useGroups } from "../../hooks/useGroups";
import { useAuth } from "../../hooks/useAuth";

type Period = "month" | "7d" | "30d" | "custom";

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Analytics() {
  const [today] = useState(() => new Date());
  const { sources, update } = useSources();
  const { transactions } = useTransactions();
  const { user, loading } = useAuth();
  const { groups } = useGroups(user?.id);
  const [addingSource, setAddingSource] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState(() => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return localDateString(date);
  });
  const [customEnd, setCustomEnd] = useState(() => localDateString(new Date()));
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState<"debit" | "credit">("debit");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const cashFlowTransactions = useMemo(() => transactions.filter((transaction) => !transaction.excludedFromCashFlow), [transactions]);
  const total = useMemo(() => sources.reduce((sum, source) => sum + (Number(source.balance) || 0), 0), [sources]);
  const range = useMemo(() => {
    if (period === "custom") return { start: customStart, end: customEnd };
    const date = period === "month"
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(today.getTime() - (Number(period.slice(0, -1)) - 1) * 24 * 60 * 60 * 1000);
    return { start: localDateString(date), end: localDateString(today) };
  }, [customEnd, customStart, period, today]);
  const periodTransactions = useMemo(() => cashFlowTransactions.filter((transaction) => {
    const date = transaction.transaction_date.slice(0, 10);
    return date >= range.start && date <= range.end;
  }), [cashFlowTransactions, range]);
  const categoryTransactions = selectedCategory
    ? periodTransactions.filter((transaction) => transaction.type === selectedCategoryType && (transaction.category || "Other") === selectedCategory)
    : [];
  const selectedGroup = selectedGroupId ? groups.find((group) => group.id === selectedGroupId) ?? null : null;
  const groupTransactions = selectedGroup
    ? periodTransactions.filter((transaction) => transaction.group_id === selectedGroup.id)
    : [];
  const choosePeriod = (value: Period) => {
    setPeriod(value);
    if (value === "custom") setShowCustomRange(true);
  };
  return <AuthGate user={user} loading={loading}><main className="mx-auto min-h-screen max-w-3xl bg-[#111112] px-5 pb-32 pt-[calc(2rem+env(safe-area-inset-top))]"><section className="glass mb-6 rounded-[20px] px-5 py-6"><p className="text-[15px] text-[#8E8E93]">Total Balance</p><h1 className="mt-2 text-4xl font-bold">₹{total.toLocaleString("en-IN")}</h1></section><section className="mb-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-[20px] font-semibold">Sources</h2><button type="button" aria-label="Add source" onClick={() => setAddingSource(true)} className="rounded-full bg-white p-2 text-black"><Plus size={20} /></button></div><SourceCardsScroller sources={sources} onSave={update} /></section><section className="mb-6"><div className="glass grid grid-cols-4 gap-1 rounded-2xl p-1">{(["month", "7d", "30d", "custom"] as const).map((option) => <button type="button" key={option} aria-label={option === "custom" ? "Choose custom time period" : undefined} onClick={() => choosePeriod(option)} className={`flex items-center justify-center rounded-xl px-2 py-3 text-sm font-semibold ${period === option ? "bg-white text-black" : "text-[#8E8E93]"}`}>{option === "month" ? today.toLocaleString("en-US", { month: "short" }) : option === "custom" ? <CalendarDays size={18} /> : option}</button>)}</div><p className="mt-2 text-center text-xs text-[#8E8E93]">{range.start} to {range.end}</p></section><AnalyticsCharts transactions={periodTransactions} groups={groups} onCategorySelect={(category, type) => { setSelectedCategory(category); setSelectedCategoryType(type); }} onGroupSelect={setSelectedGroupId} /><BottomNav />{addingSource && user && <AddSourceSheet userId={user.id} onSave={update} onClose={() => setAddingSource(false)} />}{showCustomRange && <DateRangeSheet initialStart={customStart} initialEnd={customEnd} onApply={(start, end) => { setCustomStart(start); setCustomEnd(end); setPeriod("custom"); }} onClose={() => setShowCustomRange(false)} />}{selectedCategory && <CategoryTransactionsSheet category={selectedCategory} transactions={categoryTransactions} type={selectedCategoryType} onClose={() => setSelectedCategory(null)} />}{selectedGroup && <GroupTransactionsSheet group={selectedGroup} transactions={groupTransactions} onClose={() => setSelectedGroupId(null)} />}</main></AuthGate>;
}
