"use client";

import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Transaction } from "../lib/types";

export function AnalyticsCharts({ transactions }: { transactions: Transaction[] }) {
  const debits = transactions.filter((item) => item.type === "debit");
  const byDay = Object.entries(debits.reduce<Record<string, number>>((acc, item) => { const key = item.transaction_date.slice(0, 10); acc[key] = (acc[key] ?? 0) + item.amount; return acc; }, {})).map(([date, amount]) => ({ date: date.slice(5), amount }));
  const byCategory = Object.entries(debits.reduce<Record<string, number>>((acc, item) => { const key = item.category || "Other"; acc[key] = (acc[key] ?? 0) + item.amount; return acc; }, {})).map(([name, value]) => ({ name, value }));
  const colors = ["#30D158", "#FFFFFF", "#8E8E93", "#FF453A", "#A5F3B7", "#D1D1D6"];
  return <div className="grid gap-6 lg:grid-cols-2"><div className="glass rounded-3xl p-5"><h2 className="mb-4 font-semibold">Spending over time</h2><div className="h-56"><ResponsiveContainer><LineChart data={byDay}><XAxis dataKey="date" stroke="#8E8E93" tickLine={false} axisLine={false} /><YAxis stroke="#8E8E93" tickLine={false} axisLine={false} width={45} /><Tooltip contentStyle={{ background: "#2C2C2E", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "#fff" }} /><Line type="monotone" dataKey="amount" stroke="#30D158" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></div><div className="glass rounded-3xl p-5"><h2 className="mb-4 font-semibold">By category</h2><div className="h-56"><ResponsiveContainer><PieChart><Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>{byCategory.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={{ background: "#2C2C2E", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "#fff" }} /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#8E8E93]">{byCategory.map((item, index) => <span key={item.name}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: colors[index % colors.length] }} />{item.name}: ₹{item.value.toLocaleString("en-IN")}</span>)}</div></div></div>;
}
