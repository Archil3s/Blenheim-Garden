"use client";

import { useEffect } from "react";

function ensureAdvancedLayoutToggle() {
  const context = document.querySelector<HTMLElement>(".gv-context");
  const modebar = context?.querySelector<HTMLElement>(".gv-v4-modebar");
  if (!context) return;
  if (!modebar) { context.querySelector(".gv-advanced-layout-toggle")?.remove(); context.classList.remove("gv-layout-expanded"); return; }
  if (context.querySelector(".gv-advanced-layout-toggle")) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "gv-advanced-layout-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "Advanced layout <span>⌄</span>";
  toggle.addEventListener("click", () => {
    const expanded = context.classList.toggle("gv-layout-expanded");
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.innerHTML = expanded ? "Hide layout <span>⌃</span>" : "Advanced layout <span>⌄</span>";
  });
  modebar.before(toggle);
}

export function GrowVegVisualPolishBridge() {
  useEffect(() => {
    const body = document.querySelector(".gv-body");
    if (!body) return;
    ensureAdvancedLayoutToggle();
    const observer = new MutationObserver(records => {
      if (records.some(record => record.target === body ||
        record.target instanceof Element && record.target.closest(".gv-context"))) ensureAdvancedLayoutToggle();
    });
    observer.observe(body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
