"use client";

import { Check } from "lucide-react";
import { useState } from "react";
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
  const [note, setNote] = useState(initialNote ?? "");

  return (
    <Sheet title="Transaction note" onClose={onClose}>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Write a note for this transaction"
        rows={5}
        className="glass w-full resize-none rounded-2xl p-4 text-sm outline-none placeholder:text-[#8E8E93]"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onSave(note.trim())}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-black"
      >
        <Check size={17} />
        Save note
      </button>
    </Sheet>
  );
}
