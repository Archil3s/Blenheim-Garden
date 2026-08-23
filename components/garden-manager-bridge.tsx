"use client";

import { useEffect } from "react";
import { ACTIVE_GARDEN_KEY, DEFAULT_GARDEN_ID, readActiveGardenId, writeActiveGardenId } from "@/lib/garden/active-garden";

const EDIT_KEY_SESSION = "blenheim-garden-edit-key";

type GardenSummary = {
  id: string;
  name: string;
  year: number;
  updatedAt?: string;
};

type GardensResponse = {
  ok: boolean;
  gardens?: GardenSummary[];
  garden?: GardenSummary;
  error?: string;
};

export function GardenManagerBridge() {
  useEffect(() => {
    if (window.location.pathname === "/3d") return;

    const fromQuery = new URL(window.location.href).searchParams.get("gardenId")?.trim();
    if (fromQuery) {
      writeActiveGardenId(fromQuery);
      const url = new URL(window.location.href);
      url.searchParams.delete("gardenId");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }

    let gardens: GardenSummary[] = [];
    let disposed = false;

    const activeName = () => gardens.find((garden) => garden.id === readActiveGardenId())?.name ?? "Blenheim Garden";

    const refreshButton = () => {
      const button = document.querySelector<HTMLButtonElement>(".gv-plan-name");
      if (!button) return;
      button.innerHTML = `${activeName().toUpperCase()} <span>Garden ▾</span>`;
      button.title = "Switch, load or create a garden";
    };

    const fetchGardens = async () => {
      try {
        const response = await fetch("/api/gardens", { cache: "no-store" });
        const data = await response.json() as GardensResponse;
        if (!disposed && response.ok && data.ok && Array.isArray(data.gardens)) {
          gardens = data.gardens;
          if (!gardens.some((garden) => garden.id === readActiveGardenId())) {
            writeActiveGardenId(gardens[0]?.id ?? DEFAULT_GARDEN_ID);
          }
          refreshButton();
        }
      } catch {
        refreshButton();
      }
    };

    const closeDialog = () => document.querySelector("[data-garden-manager-overlay]")?.remove();

    const openDialog = () => {
      closeDialog();
      const overlay = document.createElement("div");
      overlay.dataset.gardenManagerOverlay = "true";
      overlay.className = "garden-manager-overlay";

      const dialog = document.createElement("section");
      dialog.className = "garden-manager-dialog";
      dialog.innerHTML = `
        <div class="garden-manager-head">
          <div><small>MY GARDENS</small><h2>Choose a garden</h2></div>
          <button type="button" data-close aria-label="Close">×</button>
        </div>
        <div class="garden-manager-list" data-garden-list></div>
        <div class="garden-manager-new">
          <label>New garden<input type="text" maxlength="80" placeholder="e.g. Front garden" data-new-name /></label>
          <button type="button" data-create>＋ Create blank garden</button>
          <p data-status>Each garden saves as its own D1 layout. Your original Blenheim Garden is kept separately.</p>
        </div>
      `;
      overlay.append(dialog);
      document.body.append(overlay);

      const list = dialog.querySelector<HTMLElement>("[data-garden-list]")!;
      const activeId = readActiveGardenId();
      for (const garden of gardens) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `garden-manager-item ${garden.id === activeId ? "active" : ""}`;
        item.innerHTML = `<span><strong>${garden.name}</strong><small>${garden.year}${garden.id === activeId ? " · Open now" : ""}</small></span><b>${garden.id === activeId ? "✓" : "Open"}</b>`;
        item.addEventListener("click", () => {
          if (garden.id === activeId) { closeDialog(); return; }
          writeActiveGardenId(garden.id);
          window.location.reload();
        });
        list.append(item);
      }

      if (!gardens.length) {
        const empty = document.createElement("p");
        empty.className = "garden-manager-empty";
        empty.textContent = "No cloud gardens were returned yet.";
        list.append(empty);
      }

      dialog.querySelector<HTMLButtonElement>("[data-close]")?.addEventListener("click", closeDialog);
      overlay.addEventListener("pointerdown", (event) => { if (event.target === overlay) closeDialog(); });

      const nameInput = dialog.querySelector<HTMLInputElement>("[data-new-name]")!;
      const createButton = dialog.querySelector<HTMLButtonElement>("[data-create]")!;
      const status = dialog.querySelector<HTMLElement>("[data-status]")!;
      const create = async () => {
        const name = nameInput.value.trim();
        if (!name) { status.textContent = "Enter a name for the new garden."; nameInput.focus(); return; }
        const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
        if (!editKey) { status.textContent = "Set your edit key in Settings first, then create the garden."; return; }
        createButton.disabled = true;
        status.textContent = "Creating garden…";
        try {
          const response = await fetch("/api/gardens", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${editKey}` },
            body: JSON.stringify({ name }),
          });
          const data = await response.json() as GardensResponse;
          if (!response.ok || !data.ok || !data.garden) {
            if (response.status === 401) sessionStorage.removeItem(EDIT_KEY_SESSION);
            status.textContent = data.error ?? "Unable to create garden.";
            createButton.disabled = false;
            return;
          }
          writeActiveGardenId(data.garden.id);
          window.location.reload();
        } catch {
          status.textContent = "Unable to reach the garden service.";
          createButton.disabled = false;
        }
      };
      createButton.addEventListener("click", () => void create());
      nameInput.addEventListener("keydown", (event) => { if (event.key === "Enter") void create(); });
      window.setTimeout(() => nameInput.focus(), 0);
    };

    const install = () => {
      const button = document.querySelector<HTMLButtonElement>(".gv-plan-name");
      if (!button || button.dataset.gardenManager === "true") return;
      button.dataset.gardenManager = "true";
      button.addEventListener("click", openDialog);
      refreshButton();
    };

    void fetchGardens();
    install();
    const observer = new MutationObserver(() => { install(); refreshButton(); });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
      closeDialog();
      // Keep the active garden id persistent across reloads.
      void ACTIVE_GARDEN_KEY;
    };
  }, []);

  return null;
}
