"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { createPortal } from "react-dom";

const openSheets = new Set<HTMLElement>();
const originalInert = new Map<HTMLElement, boolean>();

function updateInertSurfaces() {
  const surfaces = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement);

  if (openSheets.size === 0) {
    for (const [surface, wasInert] of originalInert) surface.inert = wasInert;
    originalInert.clear();
    return;
  }

  const topSheet = surfaces.filter((surface) => openSheets.has(surface)).at(-1);
  for (const surface of surfaces) {
    if (!originalInert.has(surface)) originalInert.set(surface, surface.inert);
    surface.inert = surface !== topSheet;
  }
}

export function Sheet({ title, onClose, onCancel, children }: {
  title: string;
  onClose: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const dragY = useRef(0);
  const panel = useRef<HTMLElement | null>(null);
  const backdrop = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const currentBackdrop = backdrop.current;
    if (!currentBackdrop) return;

    openSheets.add(currentBackdrop);
    updateInertSurfaces();
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      openSheets.delete(currentBackdrop);
      updateInertSurfaces();
    };
  }, []);

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
    if (dragY.current > 90) closeTimer.current = window.setTimeout(onClose, 0);
    else if (panel.current) panel.current.style.transform = "";
    startY.current = null;
    dragY.current = 0;
  };
  if (typeof document === "undefined") return null;
  return createPortal(<div ref={backdrop} className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) onClose(); }}>
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
