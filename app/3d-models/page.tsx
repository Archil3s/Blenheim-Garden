import Link from "next/link";

export const metadata = {
  title: "Vegetable model library | Blenheim Garden",
  description: "Inspect and download the garden's textured 3D vegetable models.",
};

export default function VegetableModelsPage() {
  return (
    <main style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", background: "#e6ede6", color: "#294030", fontFamily: "Arial, sans-serif" }}>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", padding: "12px 16px", borderBottom: "1px solid #c4d1c5", fontSize: 13 }}>
        <strong style={{ marginRight: "auto" }}>Vegetable model library</strong>
        <Link href="/3d">3D garden</Link>
        <Link href="/3d-models/tomato">Tomato workshop</Link>
      </header>
      <iframe title="Interactive vegetable models" src="/models/vegetables/index.html" style={{ width: "100%", height: "100%", minHeight: 0, border: 0 }} />
    </main>
  );
}
