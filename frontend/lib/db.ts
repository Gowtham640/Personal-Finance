import { DBSchema, IDBPDatabase, openDB } from "idb";
import { BalanceHistory, Source, Transaction, User } from "./types";
import { CategoryMapping } from "./merchant-intelligence";

type MetaValue = string | User | CategoryMapping | null;

interface ExpenseDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { "by-date": string; "by-category": string; "by-user": string };
  };
  sources: { key: string; value: Source; indexes: { "by-user": string } };
  balance_history: { key: string; value: BalanceHistory; indexes: { "by-user": string } };
  meta: { key: string; value: { key: string; value: MetaValue } };
}

let database: Promise<IDBPDatabase<ExpenseDB>> | undefined;

export function getDB() {
  if (typeof window === "undefined") return undefined;
  database ??= openDB<ExpenseDB>("expense-tracker", 1, {
    upgrade(db) {
      const transactions = db.createObjectStore("transactions", { keyPath: "id" });
      transactions.createIndex("by-date", "transaction_date");
      transactions.createIndex("by-category", "category");
      transactions.createIndex("by-user", "user_id");
      const sources = db.createObjectStore("sources", { keyPath: "id" });
      sources.createIndex("by-user", "user_id");
      const history = db.createObjectStore("balance_history", { keyPath: "id" });
      history.createIndex("by-user", "user_id");
      db.createObjectStore("meta", { keyPath: "key" });
    },
  });
  return database;
}

export async function getMeta<T extends MetaValue>(key: string): Promise<T | undefined> {
  const db = getDB();
  if (!db) return undefined;
  return (await db).get("meta", key).then((item) => item?.value as T | undefined);
}

export async function setMeta(key: string, value: MetaValue) {
  const db = getDB();
  if (db) await (await db).put("meta", { key, value });
}

export async function clearLocalData() {
  const db = getDB();
  if (!db) return;
  const instance = await db;
  const tx = instance.transaction(["transactions", "sources", "balance_history", "meta"], "readwrite");
  await Promise.all([
    tx.objectStore("transactions").clear(),
    tx.objectStore("sources").clear(),
    tx.objectStore("balance_history").clear(),
    tx.objectStore("meta").clear(),
  ]);
  await tx.done;
}

export async function listTransactions() {
  const db = getDB();
  return db ? (await db).getAll("transactions") : [];
}

export async function listSources() {
  const db = getDB();
  return db ? (await db).getAll("sources") : [];
}

export async function putTransaction(transaction: Transaction) {
  const db = getDB();
  if (db) await (await db).put("transactions", transaction);
}

export async function putSource(source: Source) {
  const db = getDB();
  if (db) await (await db).put("sources", source);
}

export async function putMany<T extends "transactions" | "sources" | "balance_history">(
  store: T,
  values: ExpenseDB[T]["value"][],
) {
  const db = getDB();
  if (!db || values.length === 0) return;
  const instance = await db;
  const tx = instance.transaction(store, "readwrite");
  await Promise.all(values.map((value) => tx.store.put(value)));
  await tx.done;
}
