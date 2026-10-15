"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { editorTools, type EditorMode } from "@/lib/garden/editor-ui";
import { plantingSurfaces } from "@/lib/garden/planting-surfaces";
import type { Garden3DEditor } from "./use-garden-3d-editor";

type MenuAction = { label: string; run: () => void; disabled?: boolean };
export function GardenEditorToolbar({ editor, disabled, viewOnly, onAdd, menu }: { editor: Garden3DEditor; disabled: boolean; viewOnly: boolean; onAdd: () => void; menu: MenuAction[] }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (menuRef.current?.open && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && menuRef.current?.open) { event.preventDefault(); event.stopPropagation(); menuRef.current.open = false; menuRef.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  const active = editor.uiMode;
  const locked = disabled || viewOnly;
  const saveLabel = editor.status === "Unsaved changes" ? "Unsaved changes" : editor.status === "Saved to cloud" ? "Saved to cloud" : editor.status === "Saving…" ? "Saving…" : editor.status.includes("failed") ? "Save failed" : editor.status.startsWith("Local only") ? "Local only" : "Ready";
  return <>
    <div className="garden-edit-toolbar garden-mode-toolbar" role="toolbar" aria-label="3D garden editing">
      <nav className="garden-editor-modes" aria-label="Garden editing modes">{(["Select", "Build", "Plant", "View"] as EditorMode[]).map((m) => <button type="button" key={m} disabled={disabled || viewOnly && m !== "View"} aria-pressed={active === m} onClick={() => { if (!viewOnly) { if (m === "View") editor.setInteractionMode("navigate"); else editor.setTool("select"); } editor.setUiMode(m); }}>{m}</button>)}</nav>
      <div className="garden-primary-actions"><button type="button" disabled={locked} onClick={onAdd} aria-label="Add to garden">＋ Add</button><details ref={menuRef} className="garden-tools-menu"><summary>More tools</summary><div>{menu.filter((a) => !(a.label === "Objects" && active === "Select") && !(a.label === "Plant a bed" && active === "Plant")).map((a) => <button type="button" key={a.label} disabled={disabled || a.disabled} onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; a.run(); }}>{a.label}</button>)}<Link href="/3d-models">Vegetable models</Link><Link href="/" aria-label="← 2D Plan" data-planner-view="2d">2D Plan</Link></div></details><button type="button" aria-label="Save" disabled={locked || editor.status === "Saving…"} onClick={() => void editor.save()}>Save<small className="garden-mobile-save-state">{saveLabel === "Unsaved changes" ? "Unsaved" : saveLabel === "Saved to cloud" ? "Saved" : saveLabel}</small></button><small className={`garden-save-state ${saveLabel === "Unsaved changes" ? "is-unsaved" : ""}`} title={saveLabel}>{saveLabel}</small></div>
      <div className="garden-session-controls"><button type="button" aria-label="Undo" title="Undo" disabled={locked || !editor.canUndo} onClick={editor.undo}>↶</button><button type="button" aria-label="Redo" title="Redo" disabled={locked || !editor.canRedo} onClick={editor.redo}>↷</button><div className="garden-interaction-switch" role="group" aria-label="Canvas interaction"><button type="button" disabled={locked} aria-pressed={editor.interactionMode === "navigate"} onClick={() => { editor.setUiMode("Select"); editor.setInteractionMode("navigate"); }}>Navigate</button><button type="button" disabled={locked} aria-pressed={editor.interactionMode === "edit"} onClick={() => editor.setInteractionMode("edit")}>Edit</button></div></div>
    </div>
    {!disabled && !viewOnly && active !== "View" && <div className="garden-mode-tools" role="toolbar" aria-label={`${active} tools`}>
      {editorTools.filter((t) => t.mode === active).map((t) => <button type="button" key={t.id} aria-pressed={editor.tool === t.id} onClick={() => { if (t.id === "row" && editor.selection && plantingSurfaces(editor.plan).some(s => s.kind === editor.selection!.kind && s.id === editor.selection!.id)) editor.plantBed(); editor.setTool(t.id); if (t.mode === "Build") editor.select(null); }}>{t.label}</button>)}
      {active === "Select" && <button type="button" onClick={menu.find((a) => a.label === "Objects")?.run}>Objects</button>}
      {active === "Plant" && <button type="button" onClick={menu.find((a) => a.label === "Plant a bed")?.run}>Plant a bed</button>}
    </div>}
    {!disabled && active === "View" && <div className="garden-mode-tools garden-view-options" role="region" aria-label="View options"><label><input type="checkbox" checked={editor.showLabels} onChange={(e) => editor.setShowLabels(e.target.checked)} />Show bed labels</label><label><input type="checkbox" checked={editor.cameraLocked} onChange={(e) => editor.setCameraLocked(e.target.checked)} />Lock camera</label><button type="button" onClick={editor.fit}>Whole garden</button></div>}
  </>;
}
