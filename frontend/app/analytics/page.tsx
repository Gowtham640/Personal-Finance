"use client";

import { useMemo } from "react";
import { AnalyticsCharts } from "../../components/AnalyticsCharts";
import { BottomNav } from "../../components/BottomNav";
import { SourceCardsScroller } from "../../components/SourceCardsScroller";
import { useSources } from "../../hooks/useSources";
import { useTransactions } from "../../hooks/useTransactions";

export default function Analytics() {
  const { sources, update } = useSources();
  const { transactions } = useTransactions();
  const total = useMemo(() => sources.reduce((sum, source) => sum + source.balance, 0), [sources]);
  return <main className="mx-auto min-h-screen max-w-3xl px-5 pb-32 pt-12"><header className="mb-10 text-center"><p className="text-sm text-[#8E8E93]">Total Balance</p><h1 className="mt-2 text-4xl font-bold">₹{total.toLocaleString("en-IN")}</h1></header><section className="mb-8"><SourceCardsScroller sources={sources} onSave={update} /></section><AnalyticsCharts transactions={transactions} /><BottomNav /></main>;
}
