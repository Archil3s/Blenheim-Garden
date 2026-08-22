"use client";

import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function clickButton(selector: string) {
  const button = document.querySelector<HTMLButtonElement>(selector);
  if (!button || button.disabled) return false;
  button.click();
  return true;
}

export function PlannerShortcutsBridge() {
  useEffect(() => {
    const decorateControls = () => {
      const save = document.querySelector<HTMLButtonElement>(".gv-save");
      if (save) {
        save.title = "Save plan (Ctrl/Cmd+S)";
        save.setAttribute("aria-keyshortcuts", "Control+S Meta+S");
      }

      const undo = document.querySelector<HTMLButtonElement>('.gv-quickbar button[title="Undo"]');
      if (undo) {
        undo.title = "Undo (Ctrl/Cmd+Z)";
        undo.setAttribute("aria-keyshortcuts", "Control+Z Meta+Z");
      }

      const redo = document.querySelector<HTMLButtonElement>('.gv-quickbar button[title="Redo"]');
      if (redo) {
        redo.title = "Redo (Ctrl/Cmd+Shift+Z)";
        redo.setAttribute("aria-keyshortcuts", "Control+Shift+Z Meta+Shift+Z Control+Y");
      }

      const select = document.querySelector<HTMLButtonElement>('.gv-rail button[title="Move, resize and edit"]');
      if (select) {
        select.title = "Select / inspect (Esc)";
        select.setAttribute("aria-keyshortcuts", "Escape");
      }
    };

    decorateControls();
    const observer = new MutationObserver(decorateControls);
    observer.observe(document.body, { childList: true, subtree: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!document.querySelector(".gv-app")) return;

      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && key === "s") {
        event.preventDefault();
        clickButton(".gv-save");
        return;
      }

      if (isEditableTarget(event.target)) return;

      if (modifier && key === "z" && !event.shiftKey) {
        event.preventDefault();
        clickButton('.gv-quickbar button[title^="Undo"]');
        return;
      }

      if (modifier && ((key === "z" && event.shiftKey) || key === "y")) {
        event.preventDefault();
        clickButton('.gv-quickbar button[title^="Redo"]');
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clickButton('.gv-rail button[title^="Select / inspect"]');
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
