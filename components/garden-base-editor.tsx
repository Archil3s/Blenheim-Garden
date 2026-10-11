"use client";

import { useEffect, useRef, useState } from "react";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import type { Garden3DEditor } from "./use-garden-3d-editor";

export function GardenBaseEditor({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const size = gardenDimensions(editor.plan);
  const [width, setWidth] = useState(String(size.width / 100));
  const [depth, setDepth] = useState(String(size.height / 100));
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="garden-bed-dialog" aria-labelledby="garden-size-title" onCancel={onClose}>
    <div className="garden-bed-dialog-heading"><h2 id="garden-size-title">Garden size</h2><button type="button" aria-label="Close garden size" onClick={onClose}>×</button></div>
    <form onSubmit={(e) => { e.preventDefault(); if (editor.resizeBase(Number(width) * 100, Number(depth) * 100)) onClose(); }}>
      <div className="garden-bed-dialog-body">
        <div className="garden-bed-options">
          <label>Garden width (m)<input required type="number" min="2" max="50" step=".01" value={width} onChange={(e) => setWidth(e.target.value)} /></label>
          <label>Garden depth (m)<input required type="number" min="2" max="50" step=".01" value={depth} onChange={(e) => setDepth(e.target.value)} /></label>
        </div>
        <p>Existing beds, plants and structures keep their measured sizes and positions. The fence and ground follow the new boundary.</p>
        <p>A smaller garden must still contain the whole layout. Undo reverses resizing; Save stores it for this garden.</p>
        {editor.error && <p role="alert">{editor.error}</p>}
      </div>
      <div className="garden-bed-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="garden-bed-apply">Apply garden size</button></div>
    </form>
  </dialog>;
}
