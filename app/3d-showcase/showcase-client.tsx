"use client";

import dynamic from "next/dynamic";
import "./showcase.css";

const BotanicalShowcase = dynamic(
  () => import("@/components/garden-showcase").then((module) => module.GardenShowcase),
  {
    ssr: false,
    loading: () => (
      <main className="gs-page gs-loading">
        <div>Preparing the 3D comparison…</div>
      </main>
    ),
  },
);

export default function GardenShowcaseClient() {
  return <BotanicalShowcase />;
}
