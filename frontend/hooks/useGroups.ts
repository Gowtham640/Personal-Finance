"use client";

import { useCallback, useEffect, useState } from "react";
import { listGroups, putGroup } from "../lib/db";
import { Group } from "../lib/types";

export function useGroups(userId?: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const refresh = useCallback(async () => {
    setGroups(await listGroups(userId));
  }, [userId]);

  useEffect(() => {
    let active = true;
    void listGroups(userId).then((value) => {
      if (active) setGroups(value);
    });
    window.addEventListener("expense-data-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("expense-data-changed", refresh);
    };
  }, [refresh, userId]);

  const create = useCallback(async (name: string) => {
    if (!userId) return null;
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
  }, [refresh, userId]);

  return { groups, refresh, create };
}
