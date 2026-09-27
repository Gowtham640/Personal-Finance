"use client";

import { LogIn, LogOut, UserRound } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { googleSignInUrl, signOut } from "../lib/auth";
import { syncData } from "../lib/sync";
import { User } from "../lib/types";

export function ProfileMenu({ user, onChange }: { user: User | null; onChange: (user: User | null) => void }) {
  const [open, setOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = user?.display_name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="relative">
    <button aria-label="Profile" onClick={() => setOpen(!open)} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#d9d9d9] text-[13px] font-semibold text-black active:scale-[0.96]">
      {user?.profile_picture_url && failedUrl !== user.profile_picture_url
        ? <Image src={user.profile_picture_url} alt="" width={36} height={36} unoptimized referrerPolicy="no-referrer" onError={() => setFailedUrl(user.profile_picture_url ?? null)} className="h-full w-full object-cover" />
        : initials || <UserRound size={20} fill="black" />}
    </button>
    {open && <div className="popover glass absolute right-0 top-14 z-40 min-w-32 rounded-2xl p-1">
      {user ? <button onClick={async () => { const backedUp = await syncData(); await signOut(backedUp); onChange(null); setOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[16px] text-white hover:bg-white/10"><LogOut size={18} />Sign out</button> : <a href={googleSignInUrl} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[16px] text-white hover:bg-white/10"><LogIn size={18} />Sign in</a>}
    </div>}
  </div>;
}
