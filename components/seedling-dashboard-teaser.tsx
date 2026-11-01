"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSavedBatches, type SeedBatch } from "@/lib/garden/seedling-local";

export function SeedlingDashboardTeaser() {
  const [batches, setBatches] = useState<SeedBatch[]>([]);
  useEffect(() => { setBatches(getSavedBatches()); }, []);
  return <section className="home-section home-seedling-peek">
    <div className="home-section-heading"><div><span className="home-eyebrow">SEEDLING COMPANION</span><h2>In the propagation area</h2></div></div>
    <div className="home-peek-panel">
      <div className="home-peek-number">{batches.length.toString().padStart(2,"0")}</div>
      <p>seedling {batches.length === 1 ? "batch" : "batches"} being tracked on this device</p>
      <p className="home-peek-tip">One 36W Sansi grow light · no heat mat. Remember to check tray moisture before watering.</p>
      <Link href="/seedlings" className="home-primary">Open Seedling Companion →</Link>
    </div>
  </section>;
}
