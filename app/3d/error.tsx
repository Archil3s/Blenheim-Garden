"use client";

import { useEffect } from "react";

export default function Garden3DError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("3D garden route failed", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#dce5df", color: "#263d35", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <section style={{ width: "min(100%, 420px)", border: "1px solid #c8d5cf", borderRadius: 12, padding: 20, background: "#fff" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>3D garden could not start</h1>
        <p style={{ margin: "0 0 16px", color: "#697871", fontSize: 13, lineHeight: 1.5 }}>
          The normal garden planner is still safe. Try the 3D view again; if WebGL is unavailable on this device, use the 2D planner instead.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" onClick={reset} style={{ minHeight: 44, border: "1px solid #198b68", borderRadius: 8, padding: "0 14px", color: "#fff", background: "#198b68", fontWeight: 700 }}>Try 3D again</button>
          <a href="/" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", border: "1px solid #c8d5cf", borderRadius: 8, padding: "0 14px", color: "#315c4d", background: "#f7faf8", fontWeight: 700, textDecoration: "none" }}>Back to 2D garden</a>
        </div>
      </section>
    </main>
  );
}
