"use client";

import { useState } from "react";

type ProgressPhoto = {
  filename: string;
  filenameInArchive: string;
  caption: string;
  dateAdded: string;
  dateTaken: string | null;
};
type PhotoPack = { schemaVersion: number; gardenId: string; photos: ProgressPhoto[] };

const EDIT_KEY_SESSION = "blenheim-garden-edit-key";

function storedZipFiles(data: ArrayBuffer): Map<string, Uint8Array> {
  const view = new DataView(data);
  const files = new Map<string, Uint8Array>();
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset + 30 <= data.byteLength && view.getUint32(offset, true) === 0x04034b50) {
    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const bytes = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const start = offset + 30 + nameLength + extraLength;
    const end = start + bytes;
    if (method !== 0 || (flags & 8) || end > data.byteLength) {
      throw new Error("This importer accepts the Blenheim Garden uncompressed photo pack only.");
    }
    const name = decoder.decode(new Uint8Array(data, offset + 30, nameLength));
    if (files.has(name)) throw new Error("Duplicate filename in photo pack.");
    files.set(name, new Uint8Array(data.slice(start, end)));
    if (files.size > 200) throw new Error("Too many items in the photo pack.");
    offset = end;
  }
  if (!files.size) throw new Error("The selected ZIP contains no readable photo pack.");
  return files;
}

function validatePack(input: unknown): PhotoPack {
  if (!input || typeof input !== "object") throw new Error("Missing photo pack manifest.");
  const pack = input as Partial<PhotoPack>;
  if (pack.schemaVersion !== 1 || pack.gardenId !== "blenheim-garden" || !Array.isArray(pack.photos) || pack.photos.length > 100 || pack.photos.length === 0) {
    throw new Error("This ZIP is not a compatible Blenheim Garden photo pack.");
  }
  for (const photo of pack.photos) {
    if (!photo || typeof photo.filename !== "string" || !/^IMG_[0-9]+\.jpeg$/.test(photo.filename)
      || photo.filenameInArchive !== "photos/" + photo.filename
      || typeof photo.caption !== "string" || typeof photo.dateAdded !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(photo.dateAdded)) {
      throw new Error("The photo pack has an invalid image record.");
    }
  }
  return pack as PhotoPack;
}

export function GardenPhotoPackImport({ onComplete }: { onComplete: () => Promise<void> }) {
  const [packFile, setPackFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function importPack() {
    if (!packFile || busy) return;
    const key = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim();
    if (!key) { setError("Set your garden edit key in Planner → Settings before importing."); return; }
    setBusy(true); setError(""); setProgress("Checking photo archive…");
    let imported = 0;
    try {
      const files = storedZipFiles(await packFile.arrayBuffer());
      const manifestData = files.get("manifest.json");
      if (!manifestData) throw new Error("No manifest.json found in photo pack.");
      const manifest = validatePack(JSON.parse(new TextDecoder().decode(manifestData)) as unknown);
      const existingResponse = await fetch("/api/garden/media?targetType=garden&targetId=blenheim-garden", { cache: "no-store" });
      if (!existingResponse.ok) throw new Error("Could not check the existing photo archive.");
      const existingJson = await existingResponse.json() as { ok: boolean; items?: { caption: string | null }[] };
      if (!existingJson.ok) throw new Error("Could not check the existing photo archive.");
      const existingCaptions = (existingJson.items || []).map(item => item.caption || "");
      for (let index = 0; index < manifest.photos.length; index++) {
        const photo = manifest.photos[index];
        const prefix = "Progress / Gallery / Added " + photo.dateAdded + " / " + photo.filename + " / ";
        if (existingCaptions.some(caption => caption.startsWith(prefix))) {
          setProgress((index + 1) + " / " + manifest.photos.length + " checked · already saved photos skipped");
          continue;
        }
        const bytes = files.get(photo.filenameInArchive);
        if (!bytes || bytes.byteLength === 0 || bytes.byteLength > 6 * 1024 * 1024) {
          throw new Error("Missing or oversized image: " + photo.filename);
        }
        const form = new FormData();
        form.set("file", new File([new Uint8Array(bytes)], photo.filename, { type: "image/jpeg" }));
        form.set("targetType", "garden");
        form.set("targetId", "blenheim-garden");
        form.set("caption", (prefix + photo.caption).slice(0, 1000));
        // No EXIF capture date in this set: do not mislabel the upload date as a capture date.
        if (photo.dateTaken) form.set("capturedAt", photo.dateTaken);
        const response = await fetch("/api/garden/media", { method: "POST", headers: { Authorization: "Bearer " + key }, body: form });
        const result = await response.json() as { ok: boolean; error?: string };
        if (!response.ok || !result.ok) throw new Error(photo.filename + ": " + (result.error || "upload failed"));
        imported++;
        existingCaptions.push(prefix);
        setProgress((index + 1) + " / " + manifest.photos.length + " checked · " + imported + " new photos saved");
      }
      await onComplete();
      setProgress("Photo archive ready · " + imported + " new photos added");
      setPackFile(null);
      const input = document.getElementById("garden-photo-pack-input") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (reason) {
      setError("Saved " + imported + " photos. " + (reason instanceof Error ? reason.message : "Import failed.") + " You can retry; duplicates will be skipped.");
    } finally { setBusy(false); }
  }

  return <div className="photo-pack-import">
    <label htmlFor="garden-photo-pack-input">Import an existing dated photo archive (.zip)</label>
    <input id="garden-photo-pack-input" type="file" accept=".zip,application/zip" disabled={busy} onChange={event => { setPackFile(event.target.files?.[0] || null); setError(""); }} />
    <button type="button" disabled={!packFile || busy} onClick={() => void importPack()}>{busy ? "Importing photos…" : "Import photo archive"}</button>
    <p>Imports the Blenheim Garden photo pack, preserving original filenames and the recorded date added. Uses private garden media storage; already imported photos are skipped.</p>
    {progress && <p role="status" aria-live="polite">{progress}</p>}
    {error && <p role="alert" className="progress-error">{error}</p>}
  </div>;
}
