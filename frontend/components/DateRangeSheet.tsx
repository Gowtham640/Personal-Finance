"use client";

import { Check } from "lucide-react";
import { useSheetDraft } from "../hooks/useSheetDraft";
import { Sheet } from "./Sheet";

export function DateRangeSheet({ initialStart, initialEnd, onApply, onClose }: { initialStart: string; initialEnd: string; onApply: (start: string, end: string) => void; onClose: () => void }) {
  const [start, setStart, clearStart] = useSheetDraft("range-start", initialStart);
  const [end, setEnd, clearEnd] = useSheetDraft("range-end", initialEnd);
  const cancel = () => { clearStart(); clearEnd(); onClose(); };
  const valid = Boolean(start && end && start <= end);
  return <Sheet title="Choose Date Range" onClose={onClose} onCancel={cancel}>
    <div className="space-y-4">
      <label className="block text-xs text-white/70">Start date<input type="date" value={start} onChange={(event) => setStart(event.target.value)} className="finance-field mt-2" /></label>
      <label className="block text-xs text-white/70">End date<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="finance-field mt-2" /></label>
      <button type="button" disabled={!valid} onClick={() => { onApply(start, end); clearStart(); clearEnd(); onClose(); }} className="flex w-full items-center justify-center gap-2 rounded-full bg-white/15 p-3 text-xs disabled:opacity-40"><Check size={16} />Apply range</button>
    </div>
  </Sheet>;
}
