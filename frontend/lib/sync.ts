import { putMany, setMeta } from "./db";
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
  if (!navigator.onLine || !(await checkSession())) return;
  const [transactions, history] = await Promise.all([
    json<Transaction[]>("/api/transactions?limit=100"),
    json<import("./types").BalanceHistory[]>("/api/balance-history"),
  ]);
  if (transactions) await putMany("transactions", transactions.map((item) => ({ ...item, sync_status: "synced" })));
  if (history) await putMany("balance_history", history);
  await setMeta("last_synced_at", new Date().toISOString());
}
