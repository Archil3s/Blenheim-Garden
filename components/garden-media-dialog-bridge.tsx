"use client";

import { useEffect, useRef, useState } from "react";
import {
  GARDEN_MEDIA_LIMITS,
  classifyGardenMedia,
  maxBytesForGardenMedia,
} from "@/lib/garden/media-limits";

const EDIT_KEY_SESSION = "blenheim-garden-edit-key";

type MediaItem = {
  id: string;
  targetType: string;
  targetId: string;
  mediaType: "photo" | "video";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  capturedAt: string | null;
  caption: string | null;
  createdAt: string;
  url: string;
};

type Usage = { fileCount: number; totalBytes: number };
type Target = { targetType: "garden" | "bed" | "planting"; targetId: string; label: string };

type MediaResponse = {
  ok: boolean;
  error?: string;
  items?: MediaItem[];
  item?: MediaItem;
  usage?: Usage;
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function GardenMediaDialogBridge() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<Target>({ targetType: "garden", targetId: "blenheim-garden", label: "Garden" });
  const [items, setItems] = useState<MediaItem[]>([]);
  const [usage, setUsage] = useState<Usage>({ fileCount: 0, totalBytes: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadMedia(nextTarget: Target) {
    setBusy(true);
    setError("");
    try {
      const query = new URLSearchParams({ targetType: nextTarget.targetType, targetId: nextTarget.targetId });
      const response = await fetch(`/api/garden/media?${query.toString()}`, { cache: "no-store" });
      const data = await response.json() as MediaResponse;
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load media.");
      setItems(data.items ?? []);
      setUsage(data.usage ?? { fileCount: 0, totalBytes: 0 });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load media.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    function openMedia(event: MouseEvent) {
      const clicked = event.target as HTMLElement | null;
      if (!clicked) return;

      const mediaButton = clicked.closest("button.gv-secondary-action");
      const photosTab = clicked.closest(".gv-tabs button");
      let nextTarget: Target | null = null;

      if (mediaButton?.textContent?.includes("Photos & video")) {
        const selectionPanel = mediaButton.closest(".gv-selection-panel") as HTMLElement | null;
        const selectedName = selectionPanel?.querySelector(".gv-selection-hero h2")?.textContent?.trim() || "Selected bed";
        const plantingId = selectionPanel?.dataset.plantingId?.trim();
        const bedId = selectionPanel?.dataset.bedId?.trim();

        if (selectionPanel?.classList.contains("gv-planting-inspector") && !plantingId) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          window.alert("Save the garden once, then reopen this planting before attaching crop-specific photos or video.");
          return;
        }

        if (plantingId) nextTarget = { targetType: "planting", targetId: plantingId, label: selectedName };
        else if (bedId) nextTarget = { targetType: "bed", targetId: bedId, label: selectedName };
        else {
          const match = selectedName.match(/^Bed\s+(\d+)$/i);
          if (match) nextTarget = { targetType: "bed", targetId: match[1], label: selectedName };
        }
      } else if (photosTab?.textContent?.trim() === "Photos") {
        nextTarget = { targetType: "garden", targetId: "blenheim-garden", label: "Whole garden" };
      }

      if (!nextTarget) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setTarget(nextTarget);
      setSelectedFile(null);
      setCaption("");
      setError("");
      if (inputRef.current) inputRef.current.value = "";
      dialogRef.current?.showModal();
      void loadMedia(nextTarget);
    }

    document.addEventListener("click", openMedia, true);
    return () => document.removeEventListener("click", openMedia, true);
  }, []);

  function chooseFile(file: File | null) {
    setError("");
    setSelectedFile(file);
    if (!file) return;

    const kind = classifyGardenMedia(file.type);
    if (!kind) {
      setSelectedFile(null);
      setError("Use JPEG, PNG, WebP, HEIC/HEIF, MP4, WebM, or MOV files.");
      return;
    }

    const maximum = maxBytesForGardenMedia(kind);
    if (file.size > maximum) {
      setSelectedFile(null);
      setError(`${kind === "photo" ? "Photos" : "Videos"} must be ${Math.round(maximum / 1024 / 1024)} MB or smaller.`);
      return;
    }

    if (usage.fileCount >= GARDEN_MEDIA_LIMITS.maxFiles) {
      setSelectedFile(null);
      setError(`The garden media library is capped at ${GARDEN_MEDIA_LIMITS.maxFiles} files.`);
      return;
    }

    if (usage.totalBytes + file.size > GARDEN_MEDIA_LIMITS.maxTotalBytes) {
      setSelectedFile(null);
      setError("This file would exceed the 2 GB garden media quota.");
    }
  }

  async function upload() {
    if (!selectedFile) return;
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) {
      setError("Open Settings and save your garden edit key before uploading media.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", selectedFile);
      form.set("targetType", target.targetType);
      form.set("targetId", target.targetId);
      if (caption.trim()) form.set("caption", caption.trim());
      if (selectedFile.lastModified) form.set("capturedAt", new Date(selectedFile.lastModified).toISOString());

      const response = await fetch("/api/garden/media", {
        method: "POST",
        headers: { authorization: `Bearer ${editKey}` },
        body: form,
      });
      const data = await response.json() as MediaResponse;
      if (!response.ok || !data.ok) {
        if (response.status === 401) sessionStorage.removeItem(EDIT_KEY_SESSION);
        throw new Error(data.error || "Upload failed.");
      }

      if (data.item) setItems((current) => [data.item as MediaItem, ...current]);
      if (data.usage) setUsage(data.usage);
      setSelectedFile(null);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: MediaItem) {
    if (!window.confirm(`Delete ${item.fileName}?`)) return;
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) {
      setError("Open Settings and save your garden edit key before deleting media.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/garden/media/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${editKey}` },
      });
      const data = await response.json() as MediaResponse;
      if (!response.ok || !data.ok) throw new Error(data.error || "Delete failed.");
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setUsage((current) => ({ fileCount: Math.max(0, current.fileCount - 1), totalBytes: Math.max(0, current.totalBytes - item.sizeBytes) }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  const percent = Math.min(100, usage.totalBytes / GARDEN_MEDIA_LIMITS.maxTotalBytes * 100);

  return (
    <dialog ref={dialogRef} className="garden-media-dialog" onCancel={() => dialogRef.current?.close()}>
      <div className="garden-media-card">
        <header><div><strong>Photos & video</strong><span>{target.label}</span></div><button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}>×</button></header>
        <section className="media-quota"><div><strong>{formatBytes(usage.totalBytes)} / 2 GB</strong><span>{usage.fileCount} / {GARDEN_MEDIA_LIMITS.maxFiles} files</span></div><div className="quota-track"><i style={{ width: `${percent}%` }} /></div><small>Photo limit 6 MB · Video limit 25 MB · private R2 bucket</small></section>
        <section className="media-upload">
          <label><span>Add a photo or video</span><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} disabled={busy} /></label>
          {selectedFile && <div className="selected-file"><strong>{selectedFile.name}</strong><span>{formatBytes(selectedFile.size)}</span></div>}
          <input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={1000} placeholder="Optional caption" disabled={busy} />
          <button type="button" className="upload-action" onClick={() => void upload()} disabled={!selectedFile || busy}>{busy ? "Working…" : "Upload"}</button>
          {error && <p className="media-error">{error}</p>}
        </section>
        <section className="media-gallery">
          {busy && items.length === 0 ? <p className="media-empty">Loading…</p> : null}
          {!busy && items.length === 0 ? <p className="media-empty">No media attached here yet.</p> : null}
          {items.map((item) => <article key={item.id}><div className="media-preview">{item.mediaType === "photo" ? <img src={item.url} alt={item.caption || item.fileName} loading="lazy" /> : <video src={item.url} controls preload="metadata" />}</div><div className="media-copy"><strong>{item.caption || item.fileName}</strong><small>{formatBytes(item.sizeBytes)} · {new Date(item.capturedAt || item.createdAt).toLocaleDateString()}</small></div><button type="button" className="delete-media" onClick={() => void remove(item)} disabled={busy}>Delete</button></article>)}
        </section>
      </div>
      <style jsx>{`
        .garden-media-dialog { border: 0; padding: 0; width: min(760px, calc(100vw - 28px)); max-height: min(780px, calc(100vh - 28px)); border-radius: 9px; box-shadow: 0 20px 60px rgba(0,0,0,.3); color: #263630; }
        .garden-media-dialog::backdrop { background: rgba(24,38,33,.46); }
        .garden-media-card { background: #fff; min-height: 340px; }
        header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid #dce4e0; }
        header div { display:grid; gap:2px; } header strong { font-size:15px; } header span { font-size:11px; color:#6e7c75; } header button { border:0; background:transparent; font-size:23px; color:#64716b; cursor:pointer; }
        .media-quota { padding:13px 16px; border-bottom:1px solid #edf1ef; background:#f8faf9; } .media-quota > div:first-child { display:flex; justify-content:space-between; gap:14px; font-size:11px; } .media-quota strong { font-size:12px; }
        .quota-track { height:6px; margin:8px 0 6px; border-radius:99px; background:#e1e8e5; overflow:hidden; } .quota-track i { display:block; min-width:2px; max-width:100%; height:100%; background:#19a97b; } .media-quota small { color:#75827c; font-size:10px; }
        .media-upload { display:grid; grid-template-columns:minmax(220px,1fr) minmax(180px,1fr) auto; gap:9px; align-items:end; padding:14px 16px; border-bottom:1px solid #e7ece9; } .media-upload label { display:grid; gap:5px; font-size:11px; font-weight:700; } .media-upload input[type=file] { font-size:11px; } .media-upload > input { height:35px; border:1px solid #c4cfca; border-radius:4px; padding:0 9px; min-width:0; }
        .selected-file { grid-column:1 / -1; display:flex; justify-content:space-between; gap:12px; padding:7px 9px; background:#f4f8f6; border-radius:4px; font-size:10px; } .upload-action { height:35px; padding:0 16px; border:1px solid #138a65; border-radius:4px; background:#19a97b; color:#fff; font-weight:700; cursor:pointer; } .upload-action:disabled { opacity:.55; cursor:not-allowed; } .media-error { grid-column:1 / -1; margin:0; padding:8px 10px; border-radius:4px; background:#fff1f0; color:#a13a32; font-size:11px; }
        .media-gallery { display:grid; gap:1px; max-height:470px; overflow:auto; background:#e8eeeb; } .media-gallery article { display:grid; grid-template-columns:112px 1fr auto; gap:12px; align-items:center; padding:10px 14px; background:#fff; } .media-preview { width:112px; height:78px; border-radius:5px; overflow:hidden; background:#eef2f0; display:grid; place-items:center; } .media-preview img, .media-preview video { width:100%; height:100%; object-fit:cover; } .media-copy { min-width:0; display:grid; gap:4px; } .media-copy strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; } .media-copy small { color:#738079; font-size:10px; } .delete-media { border:1px solid #d7c0bc; background:#fff; color:#9c443c; border-radius:4px; padding:7px 10px; cursor:pointer; } .media-empty { margin:0; padding:32px; text-align:center; color:#718078; background:#fff; font-size:12px; }
        @media (max-width: 640px) { .media-upload { grid-template-columns:1fr; } .media-upload > input, .upload-action { width:100%; } .media-gallery article { grid-template-columns:84px 1fr; } .media-preview { width:84px; height:68px; } .delete-media { grid-column:2; justify-self:start; } }
      `}</style>
    </dialog>
  );
}
