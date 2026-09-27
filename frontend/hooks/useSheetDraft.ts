"use client";

import { useEffect, useState } from "react";

const drafts = new Map<string, unknown>();

export function useSheetDraft<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [value, setValue] = useState<T>(() => drafts.has(key) ? drafts.get(key) as T : initial);
  useEffect(() => { drafts.set(key, value); }, [key, value]);
  return [value, setValue, () => drafts.delete(key)];
}
