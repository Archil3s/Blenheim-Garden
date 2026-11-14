"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const GARDEN_ID = "blenheim-garden";
const EDIT_KEY_SESSION = "blenheim-garden-edit-key";
const views = Array.from({ length: 8 }, (_, index) => ({
  number: index + 1,
  title: "View " + String(index + 1).padStart(2, "0"),
  x: (index % 4) * 100 / 3,
  y: Math.floor(index / 4) * 100,
}));

type MediaItem = {
  id: string;
  mediaType: "photo" | "video";
  fileName: string;
  sizeBytes: number;
  targetType: string;
  targetId: string;
  capturedAt: string | null;
  createdAt: string;
  caption: string | null;
  url: string;
};
type MediaResult = { ok: boolean; error?: string; items?: MediaItem[]; item?: MediaItem };

function viewNumber(caption: string | null): number | null {
  const match = /^Progress \/ View (0[1-8])(?: \/ |$)/.exec(caption ?? "");
  return match ? Number(match[1]) : null;
}
function photoDate(item: MediaItem) {
  const source = item.capturedAt || item.createdAt;
  const parsed = new Date(source);
  return Number.isNaN(parsed.valueOf()) ? "Date unknown" : new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland", day: "numeric", month: "short", year: "numeric",
  }).format(parsed);
}
function BaselinePhoto({ number, name }: { number: number; name: string }) {
  const view = views[number - 1];
  return <div className="progress-start-photo" role="img" aria-label={name + ", original garden condition"} style={{ backgroundPosition: view.x + "% " + view.y + "%" }} />;
}

export function GardenPhotoProgress() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [editKey, setEditKey] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/garden/media?targetType=garden&targetId=" + GARDEN_ID, { cache: "no-store" });
      const result = await response.json() as MediaResult;
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not load photos.");
      setItems((result.items || []).filter(item => item.targetType === "garden" && item.targetId === GARDEN_ID && item.mediaType === "photo" && viewNumber(item.caption) !== null));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load photos.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedPhotos = useMemo(() => items.filter(item => viewNumber(item.caption) === selected)
    .sort((a, b) => (b.capturedAt || b.createdAt).localeCompare(a.capturedAt || a.createdAt)), [items, selected]);
  const latest = selectedPhotos[0];
  const sorted = useMemo(() => [...items].sort((a, b) => (b.capturedAt || b.createdAt).localeCompare(a.capturedAt || a.createdAt)), [items]);

  async function upload() {
    if (!files.length || busy) return;
    const key = editKey.trim() || sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() || "";
    if (!key) { setError("Enter the garden edit key to upload photos."); return; }
    if (files.some(file => !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type) || file.size > 6 * 1024 * 1024 || file.size === 0)) {
      setError("Choose JPEG, PNG, WebP or HEIC photos, up to 6 MB each."); return;
    }
    setBusy(true); setError(""); setStatus("");
    sessionStorage.setItem(EDIT_KEY_SESSION, key);
    let completed = 0;
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        form.set("targetType", "garden");
        form.set("targetId", GARDEN_ID);
        form.set("caption", "Progress / View " + String(selected).padStart(2, "0") + (notes.trim() ? " / " + notes.trim() : ""));
        if (date) form.set("capturedAt", date + "T00:00:00.000Z");
        else if (file.lastModified) form.set("capturedAt", new Date(file.lastModified).toISOString());
        const response = await fetch("/api/garden/media", { method: "POST", headers: { Authorization: "Bearer " + key }, body: form });
        const result = await response.json() as MediaResult;
        if (!response.ok || !result.ok) {
          if (response.status === 401) sessionStorage.removeItem(EDIT_KEY_SESSION);
          throw new Error(result.error || "Upload failed.");
        }
        completed += 1;
        setStatus("Uploaded " + completed + " of " + files.length + " photos");
      }
      setFiles([]); setNotes("");
      const input = document.getElementById("progress-files") as HTMLInputElement | null;
      if (input) input.value = "";
      await refresh();
    } catch (reason) {
      setError("Uploaded " + completed + " of " + files.length + ". " + (reason instanceof Error ? reason.message : "Upload failed."));
    } finally { setBusy(false); }
  }

  return <main className="photo-progress">
    <header className="progress-topbar"><Link href="/" className="progress-logo"><strong>bg.</strong> BLENHEIM GARDEN</Link><nav aria-label="Section navigation"><Link href="/">Overview</Link><Link href="/planner">Planner</Link><Link href="/seedlings">Seedlings</Link><Link href="/progress" aria-current="page">Photo progress</Link></nav></header>
    <div className="progress-content">
      <div className="progress-heading"><div><p className="progress-eyebrow">GARDEN FIELD JOURNAL / PHOTO ARCHIVE</p><h1>Track progress <em>in photographs.</em></h1><p>Eight views of the garden as it began. Return to the same viewpoints to see what changed through each season.</p></div><div className="progress-count"><strong>08</strong><span>STARTING VIEWS</span><small>Date of original photographs not recorded</small></div></div>
      <section className="progress-section" aria-labelledby="start-heading"><div className="progress-section-title"><div><span>01 / THE BEGINNING</span><h2 id="start-heading">The starting point</h2></div><p>These are your original eight garden-bed photographs. Tap any view to compare it with a later photo.</p></div>
        <div className="progress-grid">{views.map(view => <button type="button" key={view.number} className={view.number === selected ? "progress-view active" : "progress-view"} onClick={() => setSelected(view.number)} aria-pressed={view.number === selected}><BaselinePhoto number={view.number} name={view.title}/><span><strong>{view.title}</strong><small>Original condition</small></span></button>)}</div>
      </section>
      <section className="progress-section" aria-labelledby="compare-heading"><div className="progress-section-title"><div><span>02 / BEFORE & AFTER</span><h2 id="compare-heading">{views[selected-1].title} — compare over time</h2></div><p>{selectedPhotos.length ? selectedPhotos.length + " later photo(s) saved" : "No later photographs for this view yet"}</p></div>
        <div className="progress-compare"><figure><BaselinePhoto number={selected} name={views[selected-1].title}/><figcaption><strong>Before</strong><span>Original garden · date not recorded</span></figcaption></figure><figure>{latest ? <Image src={latest.url} alt={latest.caption || latest.fileName} width={440} height={952} unoptimized /> : <div className="progress-after-empty"><span>After</span><p>Add a newer photograph taken from this viewpoint.</p></div>}<figcaption><strong>{latest ? "Latest" : "After"}</strong><span>{latest ? photoDate(latest) : "Waiting for a progress photo"}</span></figcaption></figure></div>
        {selectedPhotos.length > 1 && <div className="progress-history"><h3>Earlier updates for this view</h3><div className="progress-history-grid">{selectedPhotos.slice(1).map(item => <figure key={item.id}><Image src={item.url} alt={item.caption || item.fileName} width={440} height={952} unoptimized loading="lazy"/><figcaption>{photoDate(item)}</figcaption></figure>)}</div></div>}
      </section>
      <section className="progress-section progress-add" aria-labelledby="add-heading"><div className="progress-section-title"><div><span>03 / ADD AN UPDATE</span><h2 id="add-heading">Photograph what has changed</h2></div><p>New photographs save to the garden&apos;s existing media library.</p></div>
        <div className="progress-form"><label>Choose viewpoint<select value={selected} onChange={e => setSelected(Number(e.target.value))}>{views.map(v => <option value={v.number} key={v.number}>{v.title}</option>)}</select></label><label>Photo date<input type="date" value={date} onChange={e => setDate(e.target.value)}/><small>Leave blank to use your file&apos;s modified date.</small></label><label className="progress-file-label">Add photos<input id="progress-files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e => setFiles(Array.from(e.target.files || []))}/><small>{files.length ? files.length + " selected" : "JPEG, PNG, WebP or HEIC · up to 6 MB each"}</small></label><label className="progress-notes">What changed?<textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={900} rows={3} placeholder="E.g. cleared weeds, added compost, planted the first seedlings" /></label><label className="progress-key">Garden edit key<input type="password" value={editKey} onChange={e => setEditKey(e.target.value)} autoComplete="off" placeholder="Leave blank to use the key saved in the planner"/><small>Stored only in this browser session, not in GitHub.</small></label><div className="progress-upload-actions"><button type="button" onClick={() => void upload()} disabled={busy || !files.length}>{busy ? "Uploading…" : "Save progress photos"}</button><span role="status" aria-live="polite">{status}</span></div></div>
        {error && <p className="progress-error" role="alert">{error}</p>}
      </section>
      <section className="progress-section" aria-labelledby="updates-heading"><div className="progress-section-title"><div><span>04 / PHOTO HISTORY</span><h2 id="updates-heading">Progress journal</h2></div><p>{loading ? "Loading saved photos…" : sorted.length + " saved update(s)"}</p></div>{!loading && !sorted.length && <p className="progress-no-photos">Your original eight starting photographs are above. Later uploads will appear here in date order.</p>}<div className="progress-timeline">{sorted.map(item => <article key={item.id}><Image src={item.url} alt={item.caption || item.fileName} width={440} height={952} unoptimized loading="lazy"/><div><span>{photoDate(item)} · View {String(viewNumber(item.caption)).padStart(2,"0")}</span><h3>{item.caption?.split(" / ").slice(2).join(" / ") || "Garden progress"}</h3><button type="button" onClick={() => { const n=viewNumber(item.caption); if (n) { setSelected(n); document.getElementById("compare-heading")?.scrollIntoView({ behavior: "smooth" }); } }}>Compare with the start</button></div></article>)}</div></section>
    </div>
  </main>;
}