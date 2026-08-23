"use client";

import dynamic from "next/dynamic";

const GardenWebGL = dynamic(
  () => import("@/components/garden-webgl").then((module) => module.GardenWebGL),
  {
    ssr: false,
    loading: () => (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#dce5df", color: "#344a41", fontFamily: "Arial, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <strong style={{ display: "block", fontSize: 20, marginBottom: 8 }}>Opening 3D Garden…</strong>
          <span style={{ opacity: 0.72 }}>Loading the WebGL renderer</span>
        </div>
      </main>
    ),
  },
);

export function GardenWebGLLoader() {
  return <GardenWebGL />;
}
