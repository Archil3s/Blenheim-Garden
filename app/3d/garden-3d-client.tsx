"use client";

import dynamic from "next/dynamic";

const loading = () => (
  <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#dce5df", color: "#2d473e", fontFamily: "Arial, Helvetica, sans-serif" }}>
    <div style={{ textAlign: "center" }}>
      <strong style={{ display: "block", marginBottom: 8 }}>Loading 3D garden…</strong>
      <span style={{ fontSize: 12, color: "#6e7b75" }}>Starting the responsive garden renderer.</span>
    </div>
  </main>
);

const GardenWebGLResponsive = dynamic(
  () => import("@/components/garden-webgl-mobile-v2").then((module) => module.GardenWebGLMobileV2),
  { ssr: false, loading },
);

export default function Garden3DClient() {
  return <GardenWebGLResponsive />;
}
