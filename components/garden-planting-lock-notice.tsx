"use client";
import { plantingSurfaces } from "@/lib/garden/planting-surfaces";
import type { Garden3DEditor } from "./use-garden-3d-editor";

export function GardenPlantingLockNotice({ editor }: { editor: Garden3DEditor }) {
  const soil = plantingSurfaces(editor.plan).find(s => `${s.kind}:${s.id}` === editor.blockedPlantingSurfaceId);
  if (!soil || !editor.locked({ kind: soil.kind, id: soil.id }) || !["plant", "row", "fill", "brush"].includes(editor.tool) || editor.settings.targetSurfaceId && editor.settings.targetSurfaceId !== editor.blockedPlantingSurfaceId) return null;
  return <aside className="garden-planting-lock-notice" role="alert" aria-label="Planting bed locked">
    <strong>{soil.label} is locked</strong>
    <p>Its lock also protects the plants. Unlock this bed to plant; other beds and frames keep their locks.</p>
    <button type="button" onClick={editor.unlockPlantingBed}>Unlock bed for planting</button>
  </aside>;
}
