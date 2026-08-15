"use client";

import { useMemo, useState } from "react";
import { AddSourceSheet } from "../../components/AddSourceSheet";
import { AnalyticsCharts } from "../../components/AnalyticsCharts";
import { BottomNav } from "../../components/BottomNav";
import { SourceCardsScroller } from "../../components/SourceCardsScroller";
import { useSources } from "../../hooks/useSources";
import { useTransactions } from "../../hooks/useTransactions";
import { useAuth } from "../../hooks/useAuth";

export default function Analytics() {
  const { sources, update } = useSources();
  const { transactions } = useTransactions();
  const { user } = useAuth();
  const [addingSource, setAddingSource] = useState(false);
  const cashFlowTransactions = useMemo(() => transactions.filter((transaction) => !transaction.excludedFromCashFlow), [transactions]);
  const total = useMemo(() => sources.reduce((sum, source) => sum + source.balance, 0), [sources]);
  return <main className="mx-auto min-h-screen max-w-3xl px-5 pb-32 pt-12"><header className="mb-10 text-center"><p className="text-sm text-[#8E8E93]">Total Balance</p><h1 className="mt-2 text-4xl font-bold">₹{total.toLocaleString("en-IN")}</h1></header><section className="mb-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Sources</h2><button type="button" onClick={() => setAddingSource(true)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Add source</button></div><SourceCardsScroller sources={sources} onSave={update} /></section><AnalyticsCharts transactions={cashFlowTransactions} /><BottomNav />{addingSource && user && <AddSourceSheet userId={user.id} onSave={update} onClose={() => setAddingSource(false)} />}</main>;
}
