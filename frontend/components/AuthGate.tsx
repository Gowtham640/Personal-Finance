"use client";

import { LogIn, LoaderCircle } from "lucide-react";
import { googleSignInUrl } from "../lib/auth";
import { User } from "../lib/types";

export function AuthGate({
  user,
  loading,
  children,
}: {
  user: User | null;
  loading: boolean;
  children: React.ReactNode;
}) {
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

  return children;
}
