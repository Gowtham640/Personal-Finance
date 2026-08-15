"use client";

import { useEffect } from "react";
import { syncData } from "../lib/sync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void syncData().then(() => window.dispatchEvent(new Event("expense-data-changed")));
    const sync = () => void syncData().then(() => window.dispatchEvent(new Event("expense-data-changed")));
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);
  return children;
}
