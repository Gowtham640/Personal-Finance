"use client";

import { useCallback, useEffect, useState } from "react";
import { creditCategories, debitCategories } from "../lib/categories";
import { listCategories, listCategoryMappings, listTransactions, putCategory, putCategoryMapping, putTransaction } from "../lib/db";
import { CategoryRecord, TransactionType } from "../lib/types";

function defaults(userId: string): CategoryRecord[] {
  const now = new Date().toISOString();
  return [
    ...debitCategories.map((item) => ({ item, type: "debit" as const })),
    ...creditCategories.map((item) => ({ item, type: "credit" as const })),
  ].map(({ item, type }) => ({
    id: `${userId}:default:${type}:${item.name.toLowerCase()}`,
    user_id: userId,
    name: item.name,
    type,
    icon_key: item.name.toLowerCase(),
    deleted_at: null,
    updated_at: now,
    sync_status: "synced" as const,
  }));
}

export function useCategories(userId?: string) {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const refresh = useCallback(async () => {
    if (!userId) { setCategories([]); return; }
    const existing = await listCategories(userId);
    const missing = defaults(userId).filter((item) => !existing.some((record) => record.id === item.id));
    setCategories([...existing, ...missing].filter((item) => !item.deleted_at));
  }, [userId]);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    window.addEventListener("expense-data-changed", refresh);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("expense-data-changed", refresh);
    };
  }, [refresh]);

  const create = useCallback(async (name: string, type: TransactionType) => {
    if (!userId || !name.trim()) return false;
    const existing = await listCategories(userId);
    const records = [...existing, ...defaults(userId).filter((item) => !existing.some((record) => record.id === item.id))];
    if (records.some((item) => !item.deleted_at && item.type === type && item.name.toLowerCase() === name.trim().toLowerCase())) return false;
    await putCategory({
      id: crypto.randomUUID(), user_id: userId, name: name.trim(), type,
      icon_key: "other", deleted_at: null, updated_at: new Date().toISOString(), sync_status: "pending",
    });
    window.dispatchEvent(new Event("expense-data-changed"));
    return true;
  }, [userId]);

  const rename = useCallback(async (category: CategoryRecord, name: string) => {
    if (!userId || !name.trim()) return false;
    const existing = await listCategories(userId);
    const records = [...existing, ...defaults(userId).filter((item) => !existing.some((record) => record.id === item.id))];
    if (records.some((item) => item.id !== category.id && !item.deleted_at && item.type === category.type && item.name.toLowerCase() === name.trim().toLowerCase())) return false;
    const updatedAt = new Date().toISOString();
    await putCategory({ ...category, name: name.trim(), updated_at: updatedAt, sync_status: "pending" });
    const transactions = await listTransactions();
    await Promise.all(transactions.filter((item) => item.user_id === userId && item.type === category.type && item.category === category.name)
      .map((item) => putTransaction({ ...item, category: name.trim(), updated_at: updatedAt, sync_status: "pending" })));
    const mappings = await listCategoryMappings(userId);
    await Promise.all(mappings.filter((item) => item.category === category.name)
      .map((item) => putCategoryMapping({ ...item, category: name.trim(), updated_at: updatedAt, sync_status: "pending" })));
    window.dispatchEvent(new Event("expense-data-changed"));
    return true;
  }, [userId]);

  const remove = useCallback(async (category: CategoryRecord) => {
    await putCategory({ ...category, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: "pending" });
    window.dispatchEvent(new Event("expense-data-changed"));
  }, []);

  return { categories, refresh, create, rename, remove };
}
