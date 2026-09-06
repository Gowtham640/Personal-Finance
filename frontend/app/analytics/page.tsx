"use client";

import { useMemo, useState } from "react";
import { AddSourceSheet } from "../../components/AddSourceSheet";
import { AnalyticsCharts } from "../../components/AnalyticsCharts";
import { AuthGate } from "../../components/AuthGate";
import { BottomNav } from "../../components/BottomNav";
import { CategoryTransactionsSheet } from "../../components/CategoryTransactionsSheet";
import { DateRangeSheet } from "../../components/DateRangeSheet";
import { SourceCardsScroller } from "../../components/SourceCardsScroller";
import { useSources } from "../../hooks/useSources";
import { useTransactions } from "../../hooks/useTransactions";
import { useAuth } from "../../hooks/useAuth";

type Period = "month" | "7d" | "30d" | "90d" | "custom";

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
  const choosePeriod = (value: Period) => {
    setPeriod(value);
    if (value === "custom") setShowCustomRange(true);
  };
  return <AuthGate user={user} loading={loading}><main className="mx-auto min-h-screen max-w-3xl px-5 pb-32 pt-12"><header className="mb-10 text-center"><p className="text-sm text-[#8E8E93]">Total Balance</p><h1 className="mt-2 text-4xl font-bold">₹{total.toLocaleString("en-IN")}</h1></header><section className="mb-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Sources</h2><button type="button" onClick={() => setAddingSource(true)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Add source</button></div><SourceCardsScroller sources={sources} onSave={update} /></section><section className="mb-6"><div className="glass grid grid-cols-5 gap-1 rounded-2xl p-1">{(["month", "7d", "30d", "90d", "custom"] as const).map((option) => <button type="button" key={option} onClick={() => choosePeriod(option)} className={`rounded-xl px-2 py-3 text-xs font-semibold ${period === option ? "bg-white text-black" : "text-[#8E8E93]"}`}>{option === "month" ? "This month" : option === "custom" ? "Custom" : option}</button>)}</div><p className="mt-2 text-center text-xs text-[#8E8E93]">{range.start} to {range.end}</p></section><AnalyticsCharts transactions={periodTransactions} sources={sources} onCategorySelect={(category, type) => { setSelectedCategory(category); setSelectedCategoryType(type); }} /><BottomNav />{addingSource && user && <AddSourceSheet userId={user.id} onSave={update} onClose={() => setAddingSource(false)} />}{showCustomRange && <DateRangeSheet initialStart={customStart} initialEnd={customEnd} onApply={(start, end) => { setCustomStart(start); setCustomEnd(end); setPeriod("custom"); }} onClose={() => setShowCustomRange(false)} />}{selectedCategory && <CategoryTransactionsSheet category={selectedCategory} transactions={categoryTransactions} type={selectedCategoryType} onClose={() => setSelectedCategory(null)} />}</main></AuthGate>;
}
