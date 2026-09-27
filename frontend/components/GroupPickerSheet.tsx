"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useSheetDraft } from "../hooks/useSheetDraft";
import { Group } from "../lib/types";
import { Sheet } from "./Sheet";

export function GroupPickerSheet({
  groups, currentGroupId = null, onSelect, onCreate, onRename, onDelete, onClose,
}: {
  groups: Group[];
  currentGroupId?: string | null;
  onSelect?: (groupId: string | null) => void;
  onCreate: (name: string) => Promise<Group | null>;
  onRename?: (group: Group, name: string) => Promise<boolean>;
  onDelete?: (group: Group) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName, clearName] = useSheetDraft("group-name", "");
  const [editing, setEditing, clearEditing] = useSheetDraft<Group | null>("group-editing", null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    if (editing) {
      if (await onRename?.(editing, name)) { setEditing(null); clearEditing(); setName(""); clearName(); setError(""); }
      else setError("Choose a different group name.");
    } else {
      const group = await onCreate(name);
      if (group) {
        setName(""); clearName(); setError("");
        if (onSelect) { onSelect(group.id); onClose(); }
      } else setError("Could not create group.");
    }
    setSaving(false);
  };
  const cancel = () => { clearName(); clearEditing(); onClose(); };
  return <Sheet title={onSelect ? "Add to group" : "Groups"} onClose={onClose} onCancel={cancel}>
    <div className="max-h-[45dvh] space-y-1 overflow-y-auto">
      {groups.map((group) => <div key={group.id} className="flex items-center gap-1 rounded-xl bg-white/5 px-2 py-1">
        <button type="button" onClick={() => { if (onSelect) { onSelect(group.id); onClose(); } else { setEditing(group); setName(group.name); } }} className="min-w-0 flex-1 truncate px-2 py-2 text-left text-xs">{group.name}{group.id === currentGroupId && <span className="ml-2 text-white/50">Selected</span>}</button>
        {onRename && <button type="button" aria-label={`Rename ${group.name}`} onClick={() => { setEditing(group); setName(group.name); }} className="p-2 text-white/50"><Pencil size={15} /></button>}
        {onDelete && <button type="button" aria-label={`Delete ${group.name}`} onClick={() => void onDelete(group)} className="p-2 text-(--red)"><Trash2 size={15} /></button>}
      </div>)}
      {currentGroupId && onSelect && <button type="button" onClick={() => { onSelect(null); onClose(); }} className="px-4 py-2 text-xs text-white/60">Remove from group</button>}
    </div>
    <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder={editing ? "Rename group" : "New group"} className="finance-field" />
      <button type="button" aria-label={editing ? "Save group" : "Add group"} disabled={!name.trim() || saving} onClick={() => void save()} className="rounded-lg bg-white px-3 text-black disabled:opacity-40">{editing ? <Check size={17} /> : <Plus size={17} />}</button>
    </div>
    {editing && <button type="button" onClick={() => { setEditing(null); clearEditing(); setName(""); clearName(); }} className="mt-2 text-xs text-white/50">Cancel edit</button>}
    {error && <p role="alert" className="mt-3 text-xs text-(--red)">{error}</p>}
  </Sheet>;
}
