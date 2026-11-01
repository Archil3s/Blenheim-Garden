"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addDays, findGuide, formatNzDate, getSavedBatches, type SeedBatch } from "@/lib/garden/seedling-local";

export function SeedlingDashboardTeaser() {
  const [batches, setBatches] = useState<SeedBatch[] | null>(null);

  useEffect(() => { queueMicrotask(() => setBatches(getSavedBatches())); }, []);

  const active = batches?.filter((batch) => batch.stage !== "planted") ?? [];
  const next = active.flatMap((batch) => {
    const guide = findGuide(batch.crop);
    return guide?.intervalDays
      ? [{ date: addDays(batch.dateSown, guide.intervalDays), label: batch.crop }]
      : [];
  }).sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <section className="home-section home-seedling-peek" aria-labelledby="seedling-home-title">
      <div className="home-section-heading"><div><span className="home-eyebrow">THE PROPAGATION BENCH</span><h2 id="seedling-home-title">Your seedling journal</h2></div></div>
      <div className="home-peek-panel">
        <div className="home-peek-head"><span>ACTIVE BATCHES</span><span>ON THIS DEVICE</span></div>
        <div className="home-peek-count"><strong>{batches === null ? "—" : String(active.length).padStart(2, "0")}</strong><span>Growing under your care</span></div>
        {next ? <div className="home-peek-upcoming"><small>NEXT PLANNED SUCCESSION</small><strong>{next.label}</strong><span>{formatNzDate(next.date)}</span></div> :
        <p className="home-peek-empty">{active.length ? "Check each tray's moisture and growth stage before choosing the next task." : "No active batches recorded yet. Start a sowing to see its expected emergence window and care tasks here."}</p>}
        <div className="home-peek-foot"><p>Sansi 36W · no heat mat<br/>Moisture checks are observations, not automatic watering instructions.</p>
          <Link href="/seedlings">Open seedling journal <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>
  );
}
