"use client";

import dynamic from "next/dynamic";

const GardenWebGL = dynamic(
  () => import("@/components/garden-webgl").then((module) => module.GardenWebGL),
  {
    ssr: false,
    loading: () => (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#dce5df", color: "#2d473e", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Loading 3D garden…</strong>
          <span style={{ fontSize: 12, color: "#6e7b75" }}>Starting the WebGL renderer in your browser.</span>
        </div>
      </main>
    ),
  },
);

export default function Garden3DClient() {
  return <GardenWebGL />;
}
