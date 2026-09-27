"use client";

import { useRef, type PointerEvent } from "react";
import { createPortal } from "react-dom";

export function Sheet({ title, onClose, onCancel, children }: {
  title: string;
  onClose: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const dragY = useRef(0);
  const panel = useRef<HTMLElement | null>(null);
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    startY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    dragY.current = Math.max(0, event.clientY - startY.current);
    if (panel.current) panel.current.style.transform = `translateY(${dragY.current}px)`;
  };
  const endDrag = () => {
    if (dragY.current > 90) onClose();
    else if (panel.current) panel.current.style.transform = "";
    startY.current = null;
    dragY.current = 0;
  };
  if (typeof document === "undefined") return null;
  return createPortal(<div className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/60" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panel} role="dialog" aria-modal="true" aria-label={title} className="sheet finance-sheet max-h-[calc(100dvh-env(safe-area-inset-bottom))] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[24px] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-1">
      <div className="touch-none select-none pb-4" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <span className="mx-auto mb-2 block h-1 w-7 rounded-full bg-white/35" />
        <div className="relative flex min-h-6 items-center justify-center">
          <h2 className="text-center text-sm font-medium">{title}</h2>
          {onCancel && <button type="button" onClick={onCancel} className="absolute left-0 text-xs text-white/65">Cancel</button>}
        </div>
      </div>
      {children}
    </section>
  </div>, document.body);
}
