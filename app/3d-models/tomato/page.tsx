import Link from "next/link";

export const metadata = {
  title: "Tomato model test | Blenheim Garden",
  description: "Rotate and adjust the detailed botanical tomato model.",
};

export default function TomatoModelPage() {
  return (
    <main style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", background: "#e6ede6", color: "#294030", fontFamily: "Arial, sans-serif" }}>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", padding: "12px 16px", borderBottom: "1px solid #c4d1c5", fontSize: 13 }}>
        <strong style={{ marginRight: "auto" }}>Tomato · model test</strong>
        <Link href="/3d">3D garden</Link>
        <a href="/models/tomato/tomato-refined.glb" download>Download model</a>
      </header>
      <iframe title="Interactive tomato model" src="/models/tomato/index.html" style={{ width: "100%", height: "100%", minHeight: 0, border: 0 }} />
    </main>
  );
}
