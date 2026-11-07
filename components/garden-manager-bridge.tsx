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

    const activeName = () => gardens.find((garden) => garden.id === readActiveGardenId())?.name ?? (readActiveGardenId() === DEFAULT_GARDEN_ID ? "Blenheim Garden" : "Garden");

    const refreshButton = () => {
      const button = document.querySelector<HTMLButtonElement>(".gv-plan-name");
      if (!button) return;
      const year = gardens.find((garden) => garden.id === readActiveGardenId())?.year ?? new Date().getFullYear();
      const desiredText = `${activeName().toUpperCase()} ${year} ▾`;
      // Replacing children unconditionally would retrigger this bridge's observer.
      if (button.textContent !== desiredText) {
        button.replaceChildren(document.createTextNode(`${activeName().toUpperCase()} `));
        const label = document.createElement("span");
        label.textContent = `${year} ▾`;
        button.append(label);
      }
      button.title = "Switch, load or create a garden";
    };

    const fetchGardens = async () => {
      try {
        const response = await fetch("/api/gardens", { cache: "no-store" });
        const data = await response.json() as GardensResponse;
        if (!disposed && response.ok && data.ok && Array.isArray(data.gardens)) {
          gardens = data.gardens;
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
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Choose a garden");
      dialog.addEventListener("keydown", event => { if (event.key === "Escape") closeDialog(); });
      dialog.innerHTML = `
        <div class="garden-manager-head">
          <div><small>MY GARDENS</small><h2>Choose a garden</h2></div>
          <button type="button" data-close aria-label="Close">×</button>
        </div>
        <div class="garden-manager-list" data-garden-list></div>
        <div class="garden-manager-new">
          <label>New garden<input type="text" maxlength="80" placeholder="e.g. Front garden" data-new-name /></label>
          <label>Edit key<input type="password" autocomplete="off" data-edit-key placeholder="Your garden edit key" /></label>
          <button type="button" data-create>＋ Create blank garden</button>
          <p data-status role="status">Start with an empty 9 × 10.8 m garden. Your current garden stays separate.</p>
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
        item.innerHTML = `<span><strong></strong><small>${garden.year}${garden.id === activeId ? " · Open now" : ""}</small></span><b>${garden.id === activeId ? "✓" : "Open"}</b>`;
        item.querySelector("strong")!.textContent = garden.name;
        item.addEventListener("click", () => {
          if (garden.id === activeId) { closeDialog(); return; }
          if (document.querySelector<HTMLElement>(".gv-app")?.dataset.notesDirty === "true") { dialog.querySelector<HTMLElement>("[data-status]")!.textContent = "Save your notes before switching gardens."; return; }
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
      const keyInput = dialog.querySelector<HTMLInputElement>("[data-edit-key]")!;
      keyInput.value = sessionStorage.getItem(EDIT_KEY_SESSION) ?? "";
      let creating = false;
      const create = async () => {
        if (creating) return;
        if (document.querySelector<HTMLElement>(".gv-app")?.dataset.notesDirty === "true") { status.textContent = "Save your notes before creating another garden."; return; }
        const name = nameInput.value.trim();
        if (!name) { status.textContent = "Enter a name for the new garden."; nameInput.focus(); return; }
        const editKey = keyInput.value.trim();
        if (!editKey) { status.textContent = "Enter your edit key to create a garden."; keyInput.focus(); return; }
        sessionStorage.setItem(EDIT_KEY_SESSION, editKey);
        creating = true;
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
            creating = false;
            return;
          }
          writeActiveGardenId(data.garden.id);
          window.location.reload();
        } catch {
          status.textContent = "Unable to reach the garden service.";
          createButton.disabled = false;
            creating = false;
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
    const openFromRibbon = (event: Event) => {
      openDialog();
      if ((event as CustomEvent<string>).detail === "new") document.querySelector<HTMLInputElement>("[data-new-name]")?.focus();
    };
    window.addEventListener("garden-manager-open", openFromRibbon);

    void fetchGardens();
    install();
    const observer = new MutationObserver(() => { install(); refreshButton(); });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("garden-manager-open", openFromRibbon);
      closeDialog();
      // Keep the active garden id persistent across reloads.
      void ACTIVE_GARDEN_KEY;
    };
  }, []);

  return null;
}
