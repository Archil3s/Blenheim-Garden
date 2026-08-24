"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const loading = () => (
  <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#dce5df", color: "#2d473e", fontFamily: "Arial, Helvetica, sans-serif" }}>
    <div style={{ textAlign: "center" }}>
      <strong style={{ display: "block", marginBottom: 8 }}>Loading 3D garden…</strong>
      <span style={{ fontSize: 12, color: "#6e7b75" }}>Choosing the best renderer for this screen.</span>
    </div>
  </main>
);

const GardenWebGLDesktop = dynamic(
  () => import("@/components/garden-webgl").then((module) => module.GardenWebGL),
  { ssr: false, loading },
);

const GardenWebGLMobile = dynamic(
  () => import("@/components/garden-webgl-mobile-v2").then((module) => module.GardenWebGLMobileV2),
  { ssr: false, loading },
);

export default function Garden3DClient() {
  const [phoneMode, setPhoneMode] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 840px)");
    const update = () => setPhoneMode(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (phoneMode === null) return loading();
  return phoneMode ? <GardenWebGLMobile /> : <GardenWebGLDesktop />;
}
