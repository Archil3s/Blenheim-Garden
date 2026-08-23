"use client";

import { useEffect } from "react";
import { readActiveGardenId } from "@/lib/garden/active-garden";

export function WebglLaunchBridge() {
  useEffect(() => {
    const install = () => {
      if (window.location.pathname === "/3d") return;
      const tabs = document.querySelector<HTMLElement>(".gv-tabs");
      if (!tabs || tabs.querySelector("[data-webgl-launch]")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.webglLaunch = "true";
      button.className = "gv-webgl-launch";
      button.textContent = "Live 3D";
      button.title = "Open a live 3D companion window for this garden";
      button.addEventListener("click", () => {
        const gardenId = readActiveGardenId();
        const companion = window.open(`/3d?gardenId=${encodeURIComponent(gardenId)}`, `blenheim-garden-live-3d-${gardenId}`);
        companion?.focus();
      });
      tabs.append(button);
    };

    install();
    const observer = new MutationObserver(install);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
