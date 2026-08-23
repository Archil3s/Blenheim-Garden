export const metadata = {
  title: "3D Garden | Blenheim Garden",
  description: "3D garden view temporarily disabled while the planner is stabilised.",
};

export default function Garden3DPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f6f3", color: "#26362f", fontFamily: "Arial, sans-serif", padding: 24 }}>
      <section style={{ width: "min(560px, 100%)", background: "white", border: "1px solid #d5ddd8", borderRadius: 14, padding: 28, boxShadow: "0 12px 36px rgba(20,40,30,.08)" }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: "#577064" }}>BLENHEIM GARDEN</p>
        <h1 style={{ margin: "0 0 12px", fontSize: 28 }}>3D view temporarily paused</h1>
        <p style={{ margin: "0 0 20px", lineHeight: 1.55, color: "#536159" }}>
          The WebGL view has been disabled while the main garden planner is stabilised. Your saved gardens and planner data are unchanged.
        </p>
        <a href="/" style={{ display: "inline-block", background: "#148a64", color: "white", textDecoration: "none", fontWeight: 700, padding: "11px 16px", borderRadius: 8 }}>Back to garden planner</a>
      </section>
    </main>
  );
}
