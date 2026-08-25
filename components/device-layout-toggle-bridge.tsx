"use client";

import { useEffect } from "react";

type DeviceLayout = "mobile" | "desktop";

const STORAGE_KEY = "blenheim-garden-device-layout";
const NARROW_QUERY = "(max-width: 760px)";

function defaultMode(): DeviceLayout {
  return window.matchMedia(NARROW_QUERY).matches ? "mobile" : "desktop";
}

export function DeviceLayoutToggleBridge() {
  useEffect(() => {
    const app = document.querySelector<HTMLElement>(".gv-app");
    const quickActions = document.querySelector<HTMLElement>(".gv-quick-actions");
    if (!app || !quickActions || app.querySelector(".gv-device-toggle")) return;

    const appRoot = app;
    let activeMode: DeviceLayout = defaultMode();

    const wrapper = document.createElement("div");
    wrapper.className = "gv-device-toggle";
    wrapper.setAttribute("role", "group");
    wrapper.setAttribute("aria-label", "Planner layout");

    const mobile = document.createElement("button");
    mobile.type = "button";
    mobile.dataset.deviceLayout = "mobile";
    mobile.textContent = "📱 Mobile";
    mobile.title = "Use the touch-friendly compact planner layout";

    const desktop = document.createElement("button");
    desktop.type = "button";
    desktop.dataset.deviceLayout = "desktop";
    desktop.textContent = "🖥 Desktop";
    desktop.title = "Use the full desktop planner layout";

    wrapper.append(mobile, desktop);
    quickActions.prepend(wrapper);

    const buttons = [mobile, desktop];

    function placeToggle(mode: DeviceLayout) {
      const needsViewportOverlay = mode === "desktop" && window.matchMedia(NARROW_QUERY).matches;
      wrapper.classList.toggle("gv-device-toggle-floating", needsViewportOverlay);
      if (needsViewportOverlay) {
        if (wrapper.parentElement !== appRoot) appRoot.append(wrapper);
      } else if (wrapper.parentElement !== quickActions) {
        quickActions.prepend(wrapper);
      }
    }

    function apply(mode: DeviceLayout, persist = true) {
      activeMode = mode;
      appRoot.classList.toggle("gv-device-mobile", mode === "mobile");
      appRoot.classList.toggle("gv-device-desktop", mode === "desktop");
      appRoot.dataset.deviceLayout = mode;
      placeToggle(mode);
      buttons.forEach((button) => {
        const active = button.dataset.deviceLayout === mode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      if (persist) {
        try {
          window.localStorage.setItem(STORAGE_KEY, mode);
        } catch {
          // The current session still keeps the selected layout.
        }
      }
      window.dispatchEvent(new Event("resize"));
    }

    let saved: DeviceLayout | null = null;
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value === "mobile" || value === "desktop") saved = value;
    } catch {
      // Layout selection still works when local storage is unavailable.
    }
    apply(saved ?? defaultMode(), false);

    const onClick = (event: Event) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button[data-device-layout]");
      const mode = button?.dataset.deviceLayout;
      if (mode === "mobile" || mode === "desktop") apply(mode);
    };
    const onViewportResize = () => placeToggle(activeMode);

    wrapper.addEventListener("click", onClick);
    window.addEventListener("resize", onViewportResize);

    return () => {
      wrapper.removeEventListener("click", onClick);
      window.removeEventListener("resize", onViewportResize);
      wrapper.remove();
      appRoot.classList.remove("gv-device-mobile", "gv-device-desktop");
      delete appRoot.dataset.deviceLayout;
    };
  }, []);

  return null;
}
