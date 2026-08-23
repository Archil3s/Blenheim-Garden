"use client";

import { useEffect } from "react";

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
      button.title = "Open a live 3D companion window";
      button.addEventListener("click", () => {
        const companion = window.open("/3d", "blenheim-garden-live-3d");
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
