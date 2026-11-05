"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { readActiveGardenId } from "@/lib/garden/active-garden";

export type PlanNotesHandle = { save: () => Promise<"cloud" | "local" | null> };

export function PlannerPlanNotes({ open, onDirty, ref }: {
  open: boolean; onDirty: (value: boolean) => void; ref: Ref<PlanNotesHandle>;
}) {
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState("");
  const [status, setStatus] = useState("Loading notes…");
  const edited = useRef(false);
  const revision = useRef(0);

  useEffect(() => {
    let disposed = false;
    const id = readActiveGardenId();
    const key = `garden-plan-notes:${id}`;
    queueMicrotask(() => {
      try {
        const local = localStorage.getItem(key);
        if (local !== null && !edited.current) setBody(local);
      } catch { setStatus("This browser cannot retain a local draft."); }
    });
    void fetch(`/api/garden/plan-notes?gardenId=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { ok: boolean; body?: string; error?: string };
        if (!response.ok || !data.ok) throw new Error(data.error ?? "Notes could not be loaded.");
        if (disposed) return;
        const cloud = data.body ?? "";
        setSaved(cloud);
        const local = localStorage.getItem(key);
        if (!edited.current) setBody(local ?? cloud);
        setStatus("");
      }).catch((error: unknown) => { if (!disposed) setStatus(error instanceof Error ? error.message : "Notes could not be loaded."); });
    return () => { disposed = true; };
  }, []);

  useEffect(() => { onDirty(body !== saved); }, [body, saved, onDirty]);

  useImperativeHandle(ref, () => ({ save: async () => {
    if (body === saved) return null;
    const token = sessionStorage.getItem("blenheim-garden-edit-key")?.trim();
    if (!token) { setStatus("Local draft · set the garden edit key in Settings to save online."); return "local"; }
    setStatus("Saving…");
    const snapshot = body;
    const savedRevision = revision.current;
    try {
      const response = await fetch(`/api/garden/plan-notes?gardenId=${encodeURIComponent(readActiveGardenId())}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ body: snapshot }),
      });
      const data = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Notes could not be saved.");
      setSaved(snapshot);
      setStatus("Saved");
      if (revision.current === savedRevision) {
        try { localStorage.removeItem(`garden-plan-notes:${readActiveGardenId()}`); }
        catch { setStatus("Saved online. This browser could not clear the local draft."); }
      }
      return "cloud";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Notes could not be saved.");
      throw error;
    }
  } }), [body, saved]);

  return <section className="planner-plan-notes" hidden={!open} aria-label="Plan notes">
    <textarea aria-label="Plan-wide notes" value={body} maxLength={50000} onChange={(event) => {
      edited.current = true;
      revision.current++;
      setBody(event.target.value);
      try { localStorage.setItem(`garden-plan-notes:${readActiveGardenId()}`, event.target.value); }
      catch { setStatus("This browser cannot retain a local draft. Keep this page open until saved."); }
    }} />
    <p role="status">{status}</p>
  </section>;
}
