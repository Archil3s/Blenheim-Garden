"use client";

import { useEffect, useState } from "react";
import { DEFAULT_GARDEN_ID, readActiveGardenId } from "@/lib/garden/active-garden";

const BUTTON_ID = "gv-3d-preview-button";

export function Garden3DPreviewBridge() {
  const [open, setOpen] = useState(false);
  const [gardenId, setGardenId] = useState(DEFAULT_GARDEN_ID);

  useEffect(() => {
    const openPreview = () => {
      setGardenId(readActiveGardenId());
      setOpen(true);
    };

    const install = () => {
      if (document.getElementById(BUTTON_ID)) return;
      const host = document.querySelector<HTMLElement>(".gv-quick-center");
      if (!host) return;

      const button = document.createElement("button");
      button.id = BUTTON_ID;
      button.type = "button";
      button.className = "gv-3d-preview-trigger";
      button.title = "Open a lightweight 3D preview of the current 2D plan";
      button.setAttribute("aria-label", "Open 3D preview");
      button.innerHTML = '<span aria-hidden="true">◩</span><strong>3D Preview</strong>';
      button.addEventListener("click", openPreview);
      host.appendChild(button);
    };

    install();
    const observer = new MutationObserver(install);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const button = document.getElementById(BUTTON_ID);
      if (button) {
        button.removeEventListener("click", openPreview);
        button.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const previewUrl = `/3d?gardenId=${encodeURIComponent(gardenId)}&mode=preview`;
  const fullUrl = `/3d?gardenId=${encodeURIComponent(gardenId)}`;

  return (
    <div className="gv-3d-preview-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="gv-3d-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="gv-3d-preview-title">
        <header className="gv-3d-preview-header">
          <div>
            <span className="gv-3d-preview-badge">LOW-POWER</span>
            <h2 id="gv-3d-preview-title">3D Preview</h2>
            <p>Check the current 2D layout without leaving the planner.</p>
          </div>
          <div className="gv-3d-preview-actions">
            <a href={fullUrl} target="_blank" rel="noreferrer">Open full 3D ↗</a>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close 3D preview">×</button>
          </div>
        </header>
        <div className="gv-3d-preview-frame-wrap">
          <iframe
            key={gardenId}
            className="gv-3d-preview-frame"
            src={previewUrl}
            title="Lightweight 3D garden preview"
          />
        </div>
        <footer className="gv-3d-preview-footer">
          <span>Drag to rotate · pinch/wheel to zoom · tap a crop or bed to inspect</span>
          <button type="button" onClick={() => setOpen(false)}>Back to 2D</button>
        </footer>
      </section>
    </div>
  );
}
