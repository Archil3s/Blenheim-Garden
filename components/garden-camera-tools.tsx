"use client";
import { useState, type RefObject } from "react";
import type { Garden3DEditor } from "./use-garden-3d-editor";

export function GardenCameraTools({ workspace, editor }: { workspace: RefObject<HTMLDivElement | null>; editor: Garden3DEditor }) {
  const [pan, setPan] = useState(false);
  const action = (detail: string) => workspace.current?.querySelector("canvas")?.dispatchEvent(new CustomEvent("garden-camera", { detail }));
  return <details className="garden-navigation-tools"><summary>Move view</summary><div role="group" aria-label="Move garden view">
    <div><button type="button" disabled={editor.cameraLocked} aria-pressed={!pan} onClick={() => { setPan(false); editor.setInteractionMode("navigate"); action("orbit"); }}>Orbit</button><button type="button" disabled={editor.cameraLocked} aria-pressed={pan} onClick={() => { setPan(true); editor.setInteractionMode("navigate"); action("pan"); }}>Pan</button></div>
    <div>{[["left", "←"], ["forward", "↑"], ["back", "↓"], ["right", "→"]].map(([name, glyph]) => <button type="button" key={name} disabled={editor.cameraLocked} aria-label={`Move view ${name}`} onClick={() => action(name)}>{glyph}</button>)}</div>
    <div><button type="button" disabled={editor.cameraLocked} aria-label="Zoom in garden" onClick={() => action("in")}>＋</button><button type="button" disabled={editor.cameraLocked} aria-label="Zoom out garden" onClick={() => action("out")}>−</button></div>
    <small>Navigate: drag to {pan ? "pan" : "orbit"}. Pinch or scroll to zoom. Arrow keys / WASD move; Home fits the garden.</small>
  </div></details>;
}
