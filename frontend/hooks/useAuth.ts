"use client";

import { useEffect, useState } from "react";
import { checkSession, getCachedUser } from "../lib/auth";
import { User } from "../lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const refresh = () => void checkSession().then((nextUser) => {
      if (active) { setUser(nextUser); setLoading(false); }
    });
    void getCachedUser().then((cachedUser) => {
      if (active && cachedUser) {
        setUser(cachedUser);
        setLoading(false);
      }
      refresh();
    });
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return { user, setUser, loading };
}
