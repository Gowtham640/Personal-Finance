"use client";

import { Check } from "lucide-react";
import { useSheetDraft } from "../hooks/useSheetDraft";
import { Sheet } from "./Sheet";

export function TransactionNoteSheet({
  initialNote,
  onSave,
  onClose,
}: {
  initialNote: string | null;
  onSave: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote, clearNote] = useSheetDraft("transaction-note", initialNote ?? "");

  return (
    <Sheet title="Transaction Note" onClose={onClose} onCancel={() => { clearNote(); onClose(); }}>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Write a note for this transaction"
        rows={5}
        className="finance-field w-full resize-none"
        autoFocus
      />
      <button
        type="button"
        onClick={() => { onSave(note.trim()); clearNote(); }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-black"
      >
        <Check size={17} />
        Save note
      </button>
    </Sheet>
  );
}
