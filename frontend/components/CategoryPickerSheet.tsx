"use client";

import { Check, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { createElement, useState } from "react";
import { useSheetDraft } from "../hooks/useSheetDraft";
import { categoryIcon, categoryIconChoices } from "../lib/categories";
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
  onCreate?: (name: string, type: TransactionType, iconKey: string) => Promise<boolean>;
  onRename?: (category: CategoryRecord, name: string, iconKey: string) => Promise<boolean>;
  onDelete?: (category: CategoryRecord) => Promise<void>;
}) {
  const [search, setSearch, clearSearch] = useSheetDraft("category-search", "");
  const [name, setName, clearName] = useSheetDraft("category-new-name", "");
  const [newType, setNewType, clearType] = useSheetDraft<TransactionType>("category-new-type", type ?? "debit");
  const [editing, setEditing, clearEditing] = useSheetDraft<CategoryRecord | null>("category-editing", null);
  const [iconKey, setIconKey, clearIconKey] = useSheetDraft("category-icon-key", "other");
  const [error, setError] = useState("");
  const visible = records.filter((item) => !item.deleted_at && (!type || item.type === type) && item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(suggestions.includes(b.name)) - Number(suggestions.includes(a.name)) || a.name.localeCompare(b.name));
  const create = async () => {
    if (!onCreate || !name.trim()) return;
    if (await onCreate(name, type ?? newType, iconKey)) { setName(""); clearName(); setIconKey("other"); clearIconKey(); setError(""); }
    else setError("That category already exists.");
  };
  const rename = async () => {
    if (!editing || !onRename) return;
    if (await onRename(editing, name, iconKey)) { setEditing(null); clearEditing(); setName(""); clearName(); setIconKey("other"); clearIconKey(); setError(""); }
    else setError("Choose a different category name.");
  };
  const beginEdit = (item: CategoryRecord) => { setEditing(item); setName(item.name); setIconKey(item.icon_key === "bills/rent" ? "bills" : item.icon_key); setError(""); };
  const cancel = () => { clearSearch(); clearName(); clearType(); clearEditing(); clearIconKey(); onClose(); };
  return <Sheet title={onSelect ? "Choose category" : "Categories"} onClose={onClose} onCancel={cancel}>
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-white/7 px-3"><Search size={15} className="text-white/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" className="w-full bg-transparent py-2.5 text-xs text-white outline-none placeholder:text-white/35" /></div>
    <div className="max-h-[45dvh] space-y-1 overflow-y-auto">
      {visible.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1">
        <button type="button" onClick={() => { if (onSelect) { onSelect(item.name); onClose(); } else beginEdit(item); }} className={`flex min-w-0 flex-1 items-center gap-3 py-2 text-left text-xs ${value === item.name ? "text-white" : "text-white/75"}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">{createElement(categoryIcon(item.name, item.icon_key), { size: 17 })}</span><span className="truncate">{item.name}</span>
          {suggestions.includes(item.name) && <Star size={13} className="ml-auto text-[#FFD60A]" />}
        </button>
        {onRename && <button type="button" aria-label={`Edit ${item.name}`} onClick={() => beginEdit(item)} className="p-2 text-white/50"><Pencil size={15} /></button>}
        {onDelete && <button type="button" aria-label={`Delete ${item.name}`} onClick={() => void onDelete(item)} className="p-2 text-(--red)"><Trash2 size={15} /></button>}
      </div>)}
    </div>
    {(onCreate || editing) && <div className="mt-4 border-t border-white/10 pt-4">
      {!type && !editing && <div className="mb-3 flex gap-2">{(["debit", "credit"] as const).map((option) => <button type="button" key={option} onClick={() => setNewType(option)} className={`rounded-full px-4 py-1.5 text-xs capitalize ${newType === option ? "bg-white/25" : "bg-white/5"}`}>{option}</button>)}</div>}
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder={editing ? "Rename category" : "New category"} className="finance-field" />
      <div role="group" aria-label="Category icon" className="mt-4">
        <p className="mb-2 text-xs text-white/65">Icon</p>
        <div className="grid grid-cols-6 gap-2">
          {categoryIconChoices.map(({ key, label, icon: Icon }) => <button key={key} type="button" aria-label={`Choose ${label} icon`} aria-pressed={iconKey === key} title={label} onClick={() => setIconKey(key)} className={`flex aspect-square items-center justify-center rounded-xl border ${iconKey === key ? "border-white bg-white/25 text-white" : "border-white/10 bg-white/5 text-white/60"}`}><Icon size={19} /></button>)}
        </div>
      </div>
      <button type="button" disabled={!name.trim()} onClick={() => void (editing ? rename() : create())} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">{editing ? <Check size={17} /> : <Plus size={17} />}{editing ? "Save category" : "Add category"}</button>
      {editing && <button type="button" onClick={() => { setEditing(null); clearEditing(); setName(""); clearName(); setIconKey("other"); clearIconKey(); }} className="mt-3 text-xs text-white/50">Cancel edit</button>}
    </div>}
    {error && <p role="alert" className="mt-3 text-xs text-(--red)">{error}</p>}
  </Sheet>;
}
