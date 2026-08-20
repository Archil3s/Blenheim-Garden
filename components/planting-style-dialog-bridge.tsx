"use client";

import { useEffect, useRef, useState } from "react";

const EDIT_KEY_SESSION = "blenheim-garden-edit-key";

type Pattern = "grid" | "staggered" | "rows" | "natural" | "single";
type VisualSpacing = "tight" | "normal" | "wide";

type PlantingStyle = {
  bedId: string;
  label: string;
  sortOrder: number;
  iconSize: number;
  density: number;
  pattern: Pattern;
  visualSpacing: VisualSpacing;
  autoFit: boolean;
};

type StyleResponse = {
  ok: boolean;
  error?: string;
  styles?: PlantingStyle[];
  style?: Partial<PlantingStyle>;
};

type Target = { bedId: string; label: string };

const DEFAULT_STYLE: Omit<PlantingStyle, "bedId" | "label" | "sortOrder"> = {
  iconSize: 14,
  density: 70,
  pattern: "grid",
  visualSpacing: "normal",
  autoFit: true,
};

function spacingPixels(value: VisualSpacing) {
  if (value === "tight") return 1;
  if (value === "wide") return 8;
  return 4;
}

function styleFor(styles: PlantingStyle[], target: Target): PlantingStyle {
  return styles.find((style) => style.bedId === target.bedId) ?? {
    ...DEFAULT_STYLE,
    bedId: target.bedId,
    label: target.label,
    sortOrder: Number.MAX_SAFE_INTEGER,
  };
}

function cropValue(panel: HTMLElement) {
  const rows = Array.from(panel.querySelectorAll("dl > div"));
  const cropRow = rows.find((row) => row.querySelector("dt")?.textContent?.trim() === "Crop");
  return cropRow?.querySelector("dd")?.textContent?.trim() ?? "";
}

export function PlantingStyleDialogBridge() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stylesRef = useRef<PlantingStyle[]>([]);
  const previewRef = useRef<PlantingStyle | null>(null);
  const syncQueuedRef = useRef(false);
  const [styles, setStyles] = useState<PlantingStyle[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [draft, setDraft] = useState<PlantingStyle | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function applyStyle(element: HTMLElement, style: PlantingStyle) {
    const iconWrap = element.querySelector<HTMLElement>(".bed-crop-icons");
    if (!iconWrap) return;

    const gap = spacingPixels(style.visualSpacing);
    element.dataset.plantPattern = style.pattern;
    element.dataset.plantSpacing = style.visualSpacing;
    element.style.setProperty("--plant-icon-size", `${style.iconSize}px`);
    element.style.setProperty("--plant-icon-gap", `${gap}px`);

    const icons = Array.from(iconWrap.querySelectorAll<HTMLElement>("i"));
    if (!icons.length) return;

    let visible = style.pattern === "single"
      ? 1
      : Math.max(1, Math.ceil(icons.length * style.density / 100));

    if (style.autoFit && style.pattern !== "single") {
      const width = iconWrap.clientWidth;
      const height = iconWrap.clientHeight;
      const cell = Math.max(1, style.iconSize + gap);
      const columns = Math.max(1, Math.floor(width / cell));
      const rows = Math.max(1, Math.floor(height / cell));
      visible = Math.min(visible, columns * rows);
    }

    icons.forEach((icon, index) => {
      icon.hidden = index >= visible;
    });
  }

  function applyAllStyles() {
    const bedElements = Array.from(document.querySelectorAll<HTMLElement>(".plan-bed"));
    if (!bedElements.length) return;

    const ordered = [...stylesRef.current].sort((a, b) => a.sortOrder - b.sortOrder);
    ordered.forEach((style, index) => {
      const element = bedElements[index];
      if (!element) return;
      const preview = previewRef.current?.bedId === style.bedId ? previewRef.current : style;
      applyStyle(element, preview);
    });

    const preview = previewRef.current;
    if (preview && !ordered.some((style) => style.bedId === preview.bedId)) {
      const selected = document.querySelector<HTMLElement>(".plan-bed.selected");
      if (selected) applyStyle(selected, preview);
    }
  }

  function queueSync() {
    if (syncQueuedRef.current) return;
    syncQueuedRef.current = true;
    window.requestAnimationFrame(() => {
      syncQueuedRef.current = false;
      applyAllStyles();
      injectTrigger();
    });
  }

  function injectTrigger() {
    const panel = document.querySelector<HTMLElement>(".gv-selection-panel[data-bed-id]");
    if (!panel || panel.querySelector(".gv-plant-style-trigger")) return;
    if (!cropValue(panel) || cropValue(panel) === "Empty") return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "gv-secondary-action gv-plant-style-trigger";
    button.textContent = "🎨 Planting style";
    const photos = Array.from(panel.querySelectorAll<HTMLButtonElement>("button.gv-secondary-action"))
      .find((candidate) => candidate.textContent?.includes("Photos & video"));
    if (photos) panel.insertBefore(button, photos);
    else panel.appendChild(button);
  }

  async function loadStyles() {
    try {
      const response = await fetch("/api/garden/planting-styles", { cache: "no-store" });
      const data = await response.json() as StyleResponse;
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load planting styles.");
      const next = data.styles ?? [];
      stylesRef.current = next;
      setStyles(next);
      queueSync();
    } catch {
      // Styling is optional. The planner remains usable if this endpoint is unavailable.
    }
  }

  useEffect(() => {
    void loadStyles();

    function openStyle(event: MouseEvent) {
      const clicked = event.target as HTMLElement | null;
      const button = clicked?.closest(".gv-plant-style-trigger");
      if (!button) return;
      const panel = button.closest<HTMLElement>(".gv-selection-panel[data-bed-id]");
      const bedId = panel?.dataset.bedId?.trim();
      if (!panel || !bedId) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const label = panel.querySelector(".gv-selection-hero h2")?.textContent?.trim() || "Selected bed";
      const nextTarget = { bedId, label };
      const nextStyle = { ...styleFor(stylesRef.current, nextTarget) };
      setTarget(nextTarget);
      setDraft(nextStyle);
      previewRef.current = nextStyle;
      setError("");
      dialogRef.current?.showModal();
      queueSync();
    }

    const observer = new MutationObserver(queueSync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", openStyle, true);
    window.addEventListener("resize", queueSync);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", openStyle, true);
      window.removeEventListener("resize", queueSync);
    };
  }, []);

  useEffect(() => {
    stylesRef.current = styles;
    queueSync();
  }, [styles]);

  function updateDraft(patch: Partial<PlantingStyle>) {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      previewRef.current = next;
      const selected = document.querySelector<HTMLElement>(".plan-bed.selected");
      if (selected) applyStyle(selected, next);
      return next;
    });
  }

  function close(revert = true) {
    if (revert) {
      previewRef.current = null;
      queueSync();
    }
    dialogRef.current?.close();
  }

  async function save() {
    if (!target || !draft) return;
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) {
      setError("Open Settings and save your garden edit key before saving the planting style.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/garden/planting-styles", {
        method: "PUT",
        headers: { "content-type": "application/json", authorization: `Bearer ${editKey}` },
        body: JSON.stringify({
          bedId: target.bedId,
          iconSize: draft.iconSize,
          density: draft.density,
          pattern: draft.pattern,
          visualSpacing: draft.visualSpacing,
          autoFit: draft.autoFit,
        }),
      });
      const data = await response.json() as StyleResponse;
      if (!response.ok || !data.ok) {
        if (response.status === 401) sessionStorage.removeItem(EDIT_KEY_SESSION);
        throw new Error(data.error || "Unable to save planting style.");
      }

      const saved = { ...draft };
      const next = stylesRef.current.some((style) => style.bedId === saved.bedId)
        ? stylesRef.current.map((style) => style.bedId === saved.bedId ? saved : style)
        : [...stylesRef.current, saved];
      stylesRef.current = next;
      setStyles(next);
      previewRef.current = null;
      close(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save planting style.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!target) return;
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) {
      setError("Open Settings and save your garden edit key before resetting the planting style.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/garden/planting-styles?bedId=${encodeURIComponent(target.bedId)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${editKey}` },
      });
      const data = await response.json() as StyleResponse;
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to reset planting style.");

      const fallback: PlantingStyle = { ...DEFAULT_STYLE, bedId: target.bedId, label: target.label, sortOrder: draft?.sortOrder ?? Number.MAX_SAFE_INTEGER };
      const next = stylesRef.current.map((style) => style.bedId === target.bedId ? fallback : style);
      stylesRef.current = next;
      setStyles(next);
      setDraft(fallback);
      previewRef.current = fallback;
      queueSync();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to reset planting style.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="planting-style-dialog" onCancel={(event) => { event.preventDefault(); close(true); }}>
      <div className="planting-style-card">
        <header>
          <div><strong>Planting style</strong><span>{target?.label ?? "Selected bed"}</span></div>
          <button type="button" aria-label="Close" onClick={() => close(true)}>×</button>
        </header>

        {draft && <div className="planting-style-body">
          <section className="style-preview">
            <span style={{ fontSize: `${draft.iconSize}px` }}>🍅</span>
            <div><strong>{draft.iconSize}px icons</strong><small>{draft.density}% display density · {draft.pattern}</small></div>
          </section>

          <label className="style-range">
            <span>Icon size <strong>{draft.iconSize}px</strong></span>
            <input type="range" min={8} max={40} step={1} value={draft.iconSize} onChange={(event) => updateDraft({ iconSize: Number(event.target.value) })} />
          </label>

          <label className="style-range">
            <span>Display density <strong>{draft.density}%</strong></span>
            <input type="range" min={10} max={100} step={5} value={draft.density} onChange={(event) => updateDraft({ density: Number(event.target.value) })} />
          </label>

          <div className="style-grid">
            <label>Pattern
              <select value={draft.pattern} onChange={(event) => updateDraft({ pattern: event.target.value as Pattern })}>
                <option value="grid">Grid</option>
                <option value="staggered">Staggered</option>
                <option value="rows">Rows</option>
                <option value="natural">Natural</option>
                <option value="single">Single icon</option>
              </select>
            </label>
            <label>Visual spacing
              <select value={draft.visualSpacing} onChange={(event) => updateDraft({ visualSpacing: event.target.value as VisualSpacing })}>
                <option value="tight">Tight</option>
                <option value="normal">Normal</option>
                <option value="wide">Wide</option>
              </select>
            </label>
          </div>

          <label className="style-check"><input type="checkbox" checked={draft.autoFit} onChange={(event) => updateDraft({ autoFit: event.target.checked })} /><span><strong>Auto-fit icons</strong><small>Reduce representative icons when they would overlap.</small></span></label>

          <p className="style-note">These are visual controls only. Your real plant count and horticultural spacing are unchanged. Canvas zoom still scales the chosen icon size normally.</p>
          {error && <p className="style-error">{error}</p>}

          <footer>
            <button type="button" className="style-reset" onClick={() => void reset()} disabled={busy}>Reset</button>
            <span />
            <button type="button" onClick={() => close(true)} disabled={busy}>Cancel</button>
            <button type="button" className="style-save" onClick={() => void save()} disabled={busy}>{busy ? "Saving…" : "Save style"}</button>
          </footer>
        </div>}
      </div>
    </dialog>
  );
}
