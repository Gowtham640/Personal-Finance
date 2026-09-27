"use client";

import { Check, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { createElement, useState } from "react";
import { useSheetDraft } from "../hooks/useSheetDraft";
import { categoryIcon } from "../lib/categories";
import { CategoryRecord, TransactionType } from "../lib/types";
import { Sheet } from "./Sheet";

export function CategoryPickerSheet({
  value, onSelect, onClose, suggestions = [], type, records = [], onCreate, onRename, onDelete,
}: {
  value: string | null;
  onSelect?: (category: string) => void;
  onClose: () => void;
  suggestions?: string[];
  type?: TransactionType;
  records?: CategoryRecord[];
  onCreate?: (name: string, type: TransactionType) => Promise<boolean>;
  onRename?: (category: CategoryRecord, name: string) => Promise<boolean>;
  onDelete?: (category: CategoryRecord) => Promise<void>;
}) {
  const [search, setSearch, clearSearch] = useSheetDraft("category-search", "");
  const [name, setName, clearName] = useSheetDraft("category-new-name", "");
  const [newType, setNewType, clearType] = useSheetDraft<TransactionType>("category-new-type", type ?? "debit");
  const [editing, setEditing, clearEditing] = useSheetDraft<CategoryRecord | null>("category-editing", null);
  const [error, setError] = useState("");
  const visible = records.filter((item) => !item.deleted_at && (!type || item.type === type) && item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(suggestions.includes(b.name)) - Number(suggestions.includes(a.name)) || a.name.localeCompare(b.name));
  const create = async () => {
    if (!onCreate || !name.trim()) return;
    if (await onCreate(name, type ?? newType)) { setName(""); clearName(); setError(""); }
    else setError("That category already exists.");
  };
  const rename = async () => {
    if (!editing || !onRename) return;
    if (await onRename(editing, name)) { setEditing(null); clearEditing(); setName(""); clearName(); setError(""); }
    else setError("Choose a different category name.");
  };
  const cancel = () => { clearSearch(); clearName(); clearType(); clearEditing(); onClose(); };
  return <Sheet title={onSelect ? "Choose category" : "Categories"} onClose={onClose} onCancel={cancel}>
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-white/7 px-3"><Search size={15} className="text-white/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" className="w-full bg-transparent py-2.5 text-xs text-white outline-none placeholder:text-white/35" /></div>
    <div className="max-h-[45dvh] space-y-1 overflow-y-auto">
      {visible.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1">
        <button type="button" onClick={() => { if (onSelect) { onSelect(item.name); onClose(); } else { setEditing(item); setName(item.name); } }} className={`flex min-w-0 flex-1 items-center gap-3 py-2 text-left text-xs ${value === item.name ? "text-white" : "text-white/75"}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">{createElement(categoryIcon(item.name), { size: 17 })}</span><span className="truncate">{item.name}</span>
          {suggestions.includes(item.name) && <Star size={13} className="ml-auto text-[#FFD60A]" />}
        </button>
        {onRename && <button type="button" aria-label={`Rename ${item.name}`} onClick={() => { setEditing(item); setName(item.name); }} className="p-2 text-white/50"><Pencil size={15} /></button>}
        {onDelete && <button type="button" aria-label={`Delete ${item.name}`} onClick={() => void onDelete(item)} className="p-2 text-(--red)"><Trash2 size={15} /></button>}
      </div>)}
    </div>
    {(onCreate || editing) && <div className="mt-4 border-t border-white/10 pt-4">
      {!type && !editing && <div className="mb-3 flex gap-2">{(["debit", "credit"] as const).map((option) => <button type="button" key={option} onClick={() => setNewType(option)} className={`rounded-full px-4 py-1.5 text-xs capitalize ${newType === option ? "bg-white/25" : "bg-white/5"}`}>{option}</button>)}</div>}
      <div className="flex gap-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder={editing ? "Rename category" : "New category"} className="finance-field" /><button type="button" aria-label={editing ? "Save category" : "Add category"} onClick={() => void (editing ? rename() : create())} className="rounded-lg bg-white px-3 text-black">{editing ? <Check size={17} /> : <Plus size={17} />}</button></div>
      {editing && <button type="button" onClick={() => { setEditing(null); clearEditing(); setName(""); clearName(); }} className="mt-2 text-xs text-white/50">Cancel edit</button>}
    </div>}
    {error && <p role="alert" className="mt-3 text-xs text-(--red)">{error}</p>}
  </Sheet>;
}
