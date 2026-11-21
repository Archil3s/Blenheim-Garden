"use client";

import { useRef } from "react";

export function PlannerFitButton({ zoom, onFit }: { zoom: number; onFit: () => void }) {
  const touch = useRef<{ id: number; x: number; y: number } | null>(null);

  return <button type="button" className="planner-fit-garden"
    title="Fit garden (0). Wheel to zoom; Space-drag to pan."
    onPointerDown={event => {
      if (event.pointerType === "touch" && event.isPrimary) {
        touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }
    }}
    onPointerCancel={() => { touch.current = null; }}
    onPointerUp={event => {
      const start = touch.current;
      if (start?.id !== event.pointerId) return;
      touch.current = null;
      // A browser can suppress the click immediately after a canvas pan.
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) onFit();
    }}
    onClick={event => {
      if (!(event.nativeEvent instanceof PointerEvent) || event.nativeEvent.pointerType !== "touch") onFit();
    }}>
    Fit garden · {zoom}%
  </button>;
}
