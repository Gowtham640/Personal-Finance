"use client";

import { useCallback, useEffect, useState } from "react";
import { listGroups, listTransactions, putGroup, putTransaction } from "../lib/db";
import { Group } from "../lib/types";

export function useGroups(userId?: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const refresh = useCallback(async () => {
    setGroups((await listGroups(userId)).filter((item) => !item.deleted_at));
  }, [userId]);

  useEffect(() => {
    let active = true;
    void listGroups(userId).then((value) => {
      if (active) setGroups(value.filter((item) => !item.deleted_at));
    });
    window.addEventListener("expense-data-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("expense-data-changed", refresh);
    };
  }, [refresh, userId]);

  const create = useCallback(async (name: string) => {
    if (!userId || !name.trim() || groups.some((item) => item.name.toLowerCase() === name.trim().toLowerCase())) return null;
    const now = new Date().toISOString();
    const group: Group = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: name.trim(),
      created_at: now,
      updated_at: now,
      sync_status: "pending",
    };
    await putGroup(group);
    await refresh();
    window.dispatchEvent(new Event("expense-data-changed"));
    return group;
  }, [groups, refresh, userId]);

  const rename = useCallback(async (group: Group, name: string) => {
    if (!name.trim() || groups.some((item) => item.id !== group.id && item.name.toLowerCase() === name.trim().toLowerCase())) return false;
    await putGroup({ ...group, name: name.trim(), updated_at: new Date().toISOString(), sync_status: "pending" });
    window.dispatchEvent(new Event("expense-data-changed"));
    return true;
  }, [groups]);

  const remove = useCallback(async (group: Group) => {
    const now = new Date().toISOString();
    await putGroup({ ...group, deleted_at: now, updated_at: now, sync_status: "pending" });
    const transactions = await listTransactions();
    await Promise.all(transactions.filter((item) => item.user_id === userId && item.group_id === group.id)
      .map((item) => putTransaction({ ...item, group_id: null, updated_at: now, sync_status: "pending" })));
    window.dispatchEvent(new Event("expense-data-changed"));
  }, [userId]);

  return { groups, refresh, create, rename, remove };
}
