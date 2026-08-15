import { listBalanceHistory, listSources, listTransactions, putMany, putSource, setMeta } from "./db";
import { api } from "./api";
import { checkSession } from "./auth";
import { Transaction } from "./types";

async function json<T>(path: string): Promise<T | null> {
  try {
    const response = await api.get(path);
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function syncData() {
  if (!navigator.onLine) return;
  const user = await checkSession();
  if (!user) return;
  const [transactions, history] = await Promise.all([
    json<Transaction[]>("/api/transactions?limit=100"),
    json<import("./types").BalanceHistory[]>("/api/balance-history"),
  ]);
  if (transactions) {
    const localTransactions = await listTransactions();
    const pendingIds = new Set(localTransactions.filter((item) => item.sync_status === "pending").map((item) => item.id));
    const pendingRefs = new Set(localTransactions.filter((item) => item.sync_status === "pending").map((item) => item.unique_ref));
    const serverTransactions = transactions
      .filter((item) => !pendingIds.has(item.id) && !pendingRefs.has(item.unique_ref))
      .map((item) => ({ ...item, sync_status: "synced" as const }));
    await putMany("transactions", serverTransactions);
  }
  if (history) await putMany("balance_history", history);
  await ensureUpiSource(user.id, history);
  await setMeta("last_synced_at", new Date().toISOString());
}

async function ensureUpiSource(userId: string, history: import("./types").BalanceHistory[] | null) {
  const sources = await listSources();
  const existing = sources.find((source) => source.user_id === userId && source.source_name.toLowerCase() === "upi");
  const localHistory = history ?? await listBalanceHistory();
  const latestSnapshot = [...localHistory]
    .filter((snapshot) => snapshot.user_id === userId)
    .sort((left, right) => right.snapshot_date.localeCompare(left.snapshot_date))[0];
  if (!latestSnapshot && existing) return;
  const upiSource = {
    id: existing?.id ?? `upi-${userId}`,
    user_id: userId,
    source_name: "UPI",
    icon_type: "gpay" as const,
    balance: latestSnapshot ? Number(latestSnapshot.balance) || 0 : 0,
    updated_at: new Date().toISOString(),
    sync_status: "synced" as const,
  };
  await putSource(upiSource);
}
