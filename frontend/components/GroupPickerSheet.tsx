"use client";

import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Group } from "../lib/types";
import { Sheet } from "./Sheet";

export function GroupPickerSheet({
  groups,
  currentGroupId,
  onSelect,
  onCreate,
  onClose,
}: {
  groups: Group[];
  currentGroupId: string | null;
  onSelect: (groupId: string | null) => void;
  onCreate: (name: string) => Promise<Group | null>;
  onClose: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const saveGroup = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || saving) return;
    setSaving(true);
    const group = await onCreate(trimmedName);
    setSaving(false);
    if (group) {
      onSelect(group.id);
      onClose();
    }
  };

  if (creating) {
    return (
      <Sheet title="Create group" onClose={onClose}>
        <button type="button" onClick={() => setCreating(false)} className="mb-5 flex items-center gap-2 text-sm text-[#8E8E93]">
          <ArrowLeft size={16} /> Back to groups
        </button>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Group name"
          autoFocus
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/30"
        />
        <button type="button" onClick={() => void saveGroup()} disabled={!name.trim() || saving} className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-40">
          Done
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet title="Add to group" onClose={onClose}>
      <div className="space-y-2">
        {groups.map((group) => (
          <button
            type="button"
            key={group.id}
            onClick={() => {
              onSelect(group.id);
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm ${group.id === currentGroupId ? "bg-white text-black" : "bg-white/5 text-white hover:bg-white/10"}`}
          >
            <span>{group.name}</span>
            {group.id === currentGroupId && <span className="text-xs font-semibold">Selected</span>}
          </button>
        ))}
        <button type="button" onClick={() => setCreating(true)} className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-3 text-left text-sm text-[#8E8E93] hover:bg-white/5">
          <Plus size={16} /> Create new group
        </button>
        {currentGroupId && (
          <button type="button" onClick={() => { onSelect(null); onClose(); }} className="w-full rounded-2xl px-4 py-3 text-left text-sm text-[#FF9F0A] hover:bg-white/5">
            Remove from group
          </button>
        )}
      </div>
      <button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">
        Done
      </button>
    </Sheet>
  );
}
