"use client";

import { LogIn, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { googleSignInUrl } from "../lib/auth";
import { User } from "../lib/types";
import { Sheet } from "./Sheet";

export function AuthGate({
  user,
  loading,
  children,
}: {
  user: User | null;
  loading: boolean;
  children: React.ReactNode;
}) {
  const [dismissedExpiry, setDismissedExpiry] = useState(false);
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <LoaderCircle className="animate-spin text-[#8E8E93]" aria-label="Checking sign-in status" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="glass w-full max-w-sm rounded-3xl p-7 text-center">
          <h1 className="text-xl font-semibold">You are not signed in</h1>
          <p className="mt-2 text-sm text-[#8E8E93]">
            Sign in to view and sync your finance data.
          </p>
          <a
            href={googleSignInUrl}
            className="mt-6 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
          >
            <LogIn size={17} />
            Sign in
          </a>
        </section>
      </main>
    );
  }

  return <>{children}{user.expired && !dismissedExpiry && <Sheet title="Gmail connection expired" onClose={() => setDismissedExpiry(true)}>
    <p className="text-center text-xs leading-5 text-white/75">Your Gmail connection is over five days old. Please sign in again to resume importing transactions.</p>
    <a href={googleSignInUrl} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold text-black"><LogIn size={16} />Sign in again</a>
  </Sheet>}</>;
}
