"use client";

import { useEffect, useState } from "react";
import { checkSession } from "../lib/auth";
import { User } from "../lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void checkSession().then((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);
  return { user, setUser, loading };
}
