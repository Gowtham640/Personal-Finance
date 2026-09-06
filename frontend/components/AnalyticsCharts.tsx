"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Source, Transaction } from "../lib/types";

function compactAmount(value: number) {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(value >= 100_000_000 ? 0 : 1).replace(/\.0$/, "")}Cr`;
  if (value >= 100_000) return `${(value / 100_000).toFixed(value >= 1_000_000 ? 0 : 1).replace(/\.0$/, "")}L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return `${Math.round(value)}`;
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tooltipAmount(value: unknown) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

export function AnalyticsCharts({ transactions, sources, onCategorySelect }: { transactions: Transaction[]; sources: Source[]; onCategorySelect: (category: string, type: "debit" | "credit") => void }) {
  const [flow, setFlow] = useState<"debit" | "credit">("debit");
  const [categoryFlow, setCategoryFlow] = useState<"debit" | "credit">("debit");
  const colors = ["#30D158", "#FFFFFF", "#8E8E93", "#FF453A", "#A5F3B7", "#D1D1D6"];
  const byDay = useMemo(() => Object.entries(transactions.filter((item) => item.type === flow).reduce<Record<string, number>>((acc, item) => {
    const key = item.transaction_date.slice(0, 10);
    acc[key] = (acc[key] ?? 0) + Number(item.amount);
    return acc;
  }, {})).sort(([left], [right]) => left.localeCompare(right)).map(([date, amount]) => ({ date, amount })), [flow, transactions]);
  const byCategory = useMemo(() => Object.entries(transactions.filter((item) => item.type === categoryFlow).reduce<Record<string, number>>((acc, item) => {
    const key = item.category || "Other";
    acc[key] = (acc[key] ?? 0) + Number(item.amount);
    return acc;
  }, {})).map(([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value), [categoryFlow, transactions]);
  const bySource = useMemo(() => sources.map((source) => ({
    name: source.source_name,
    income: transactions.filter((item) => item.type === "credit" && item.source === source.source_name).reduce((sum, item) => sum + Number(item.amount), 0),
    expense: transactions.filter((item) => item.type === "debit" && item.source === source.source_name).reduce((sum, item) => sum + Number(item.amount), 0),
  })).filter((item) => item.income || item.expense), [sources, transactions]);
  const maximumCategory = byCategory[0]?.value || 1;
  const tooltipStyle = { background: "#2C2C2E", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "#fff" };
  return <div className="grid gap-6 lg:grid-cols-2"><div className="glass rounded-3xl p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">{flow === "debit" ? "Spending" : "Income"} over time</h2><div className="flex rounded-full bg-black/20 p-1 text-xs"><button type="button" onClick={() => setFlow("debit")} className={`rounded-full px-3 py-1.5 ${flow === "debit" ? "bg-white text-black" : "text-[#8E8E93]"}`}>Expense</button><button type="button" onClick={() => setFlow("credit")} className={`rounded-full px-3 py-1.5 ${flow === "credit" ? "bg-white text-black" : "text-[#8E8E93]"}`}>Income</button></div></div><div className="h-56"><ResponsiveContainer><LineChart data={byDay}><XAxis dataKey="date" tickFormatter={dateLabel} tick={{ fontSize: 11 }} stroke="#8E8E93" tickLine={false} axisLine={false} /><YAxis tickFormatter={compactAmount} stroke="#8E8E93" tickLine={false} axisLine={false} width={45} /><Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => dateLabel(String(label))} formatter={tooltipAmount} /><Line type="monotone" dataKey="amount" stroke={flow === "debit" ? "#FF453A" : "#30D158"} strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></div><div className="glass rounded-3xl p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">{categoryFlow === "debit" ? "Spending" : "Income"} by category</h2><div className="flex rounded-full bg-black/20 p-1 text-xs"><button type="button" onClick={() => setCategoryFlow("debit")} className={`rounded-full px-3 py-1.5 ${categoryFlow === "debit" ? "bg-white text-black" : "text-[#8E8E93]"}`}>Expense</button><button type="button" onClick={() => setCategoryFlow("credit")} className={`rounded-full px-3 py-1.5 ${categoryFlow === "credit" ? "bg-white text-black" : "text-[#8E8E93]"}`}>Income</button></div></div><div className="mb-5 h-56"><ResponsiveContainer><PieChart><Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>{byCategory.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={tooltipAmount} /></PieChart></ResponsiveContainer></div><div className="space-y-3">{byCategory.length === 0 ? <p className="text-sm text-[#8E8E93]">No {categoryFlow === "debit" ? "spending" : "income"} in this period.</p> : byCategory.map((item, index) => <button type="button" key={item.name} onClick={() => onCategorySelect(item.name, categoryFlow)} className="block w-full text-left"><div className="mb-1 flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />{item.name}</span><strong>₹{item.value.toLocaleString("en-IN")}</strong></div><div className="h-2 overflow-hidden rounded-lg bg-white/10"><div className="h-full rounded-full" style={{ width: `${(item.value / maximumCategory) * 100}%`, background: colors[index % colors.length] }} /></div></button>)}</div></div><div className="glass rounded-3xl p-5 lg:col-span-2"><h2 className="mb-4 font-semibold">Income and expense by source</h2><div className="h-64"><ResponsiveContainer><BarChart data={bySource}><XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#8E8E93" tickLine={false} axisLine={false} /><YAxis tickFormatter={compactAmount} stroke="#8E8E93" tickLine={false} axisLine={false} width={45} /><Tooltip contentStyle={tooltipStyle} formatter={tooltipAmount} /><Bar dataKey="income" fill="#30D158" radius={[6, 6, 0, 0]} /><Bar dataKey="expense" fill="#FF453A" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div></div>;
}
