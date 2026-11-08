"use client";

import Link from "next/link";
import { PlantArt } from "./plant-art";
import { SeedCataloguePicker, SeedTrayEditor } from "./seed-tray-editor";
import { SeedContainerArt, SeedContainerPicker, seedContainers } from "./seed-container-art";
import { useEffect, useMemo, useState } from "react";
import { addDays, findGuide, formatNzDate, getSavedBatches, saveBatches, SEED_CROPS, type SeedBatch } from "@/lib/garden/seedling-local";

const stages: {value: SeedBatch["stage"]; label:string; hint:string}[] = [
  {value:"sown",label:"Sown",hint:"Moist, aerated growing mix; watch for emergence."},
  {value:"sprouted",label:"Cotyledons",hint:"Seed leaves are visible. Increase airflow and light."},
  {value:"true-leaves",label:"True leaves",hint:"First shaped leaves are forming; inspect roots before moving cells."},
  {value:"potted",label:"Potted on",hint:"More root space; keep the growing mix evenly moist."},
  {value:"hardening",label:"Hardening off",hint:"Gradually introduce wind and outdoor sun over 7–10 days."},
  {value:"planted",label:"Planted outside",hint:"Transplanted to a prepared bed; monitor local conditions."}
];
const cropArtName = (crop: string) => crop === "Capsicum / chilli" ? "Capsicum" : crop === "Beans" ? "Bean" : crop;
function todayNz() { return new Intl.DateTimeFormat("en-CA",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
function initialForm(): Omit<SeedBatch,"id"> {return {crop:"Tomato",variety:"",dateSown:todayNz(),count:6,site:"waihopai",method:"indoors",container:"Six-cell tray",covered:true,bottomWatered:true,stage:"sown",notes:""};}
/** A deliberately generic botanical schematic, not a crop/variety reference photo. */
function SeedStageSketch({ stage }: { stage: SeedBatch["stage"] }) {
  const index = stages.findIndex((item) => item.value === stage);
  return <svg className="seed-stage-sketch" viewBox="0 0 132 86" fill="none" aria-hidden="true">
    <path d="M12 73H120" stroke="currentColor" strokeWidth="1" opacity=".35" />
    {index === 0 ? <ellipse cx="66" cy="67" rx="11" ry="6" transform="rotate(-25 66 67)" fill="#987c57" /> :
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M66 73C66 55 65 44 66 29" />
        <path d="M66 48C51 47 43 40 41 28C53 27 63 35 66 48Z" fill="#b5c7a2"/>
        <path d="M66 45C79 44 87 37 90 26C76 26 69 33 66 45Z" fill="#b5c7a2"/>
        {index >= 2 && <>
          <path d="M66 33C53 29 48 21 49 11C62 13 67 21 66 33Z" fill="#72936f" />
          <path d="M66 31C80 26 86 19 86 9C72 13 66 21 66 31Z" fill="#72936f" />
        </>}
        {index >= 3 && <><path d="M55 73v8h22v-8" stroke="#987c57"/><path d="M48 73h36" stroke="#987c57"/></>}
      </g>}
  </svg>;
}

export function SeedlingCompanion() {
  const [batches,setBatches] = useState<SeedBatch[]>([]);
  const [loaded,setLoaded] = useState(false);
  const [showForm,setShowForm] = useState(false);
  const [form,setForm] = useState(initialForm);
  const mappedCells = form.cells ?? [];
  const [site,setSite] = useState<SeedBatch["site"]>("waihopai");
  const [filter,setFilter] = useState<"all" | "indoor" | "outdoor">("all");
  const [now,setNow] = useState<Date|null>(null);
  useEffect(()=>{ queueMicrotask(()=>{setBatches(getSavedBatches());setLoaded(true);setNow(new Date());}); },[]);
  const date = now ?? new Date("2026-11-01T12:00:00+13:00");
  const month = Number(new Intl.DateTimeFormat("en-NZ",{timeZone:"Pacific/Auckland",month:"numeric"}).format(date));
  const today = todayNz();
  const planned = useMemo(()=>SEED_CROPS.map(crop=>({...crop, indoor:crop.indoorMonths?.includes(month)??false, outdoor:crop.outdoorMonths.includes(month)})).filter(c=>c.indoor||c.outdoor),[month]);
  const visible = batches.filter(b=>filter==="all"||(filter==="indoor"?b.method!=="direct":b.method==="direct"));
  function persist(next:SeedBatch[]) { setBatches(next);saveBatches(next); }
  function patchBatch(id:string,update:Partial<SeedBatch>){ persist(batches.map(x=>x.id===id?{...x,...update}:x)); }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const first = mappedCells[0];
    const batch = first
      ? { ...form, crop: first.crop, variety: first.variety, count: mappedCells.length }
      : { ...form, cells: undefined };
    persist([{ ...batch, id: crypto.randomUUID() }, ...batches]);
    setForm(initialForm());
    setShowForm(false);
  }
  return <main className="seed-page">
    <header className="seed-nav"><Link href="/" className="seed-back">← Blenheim Garden</Link><div><Link href="/planner">Garden planner ↗</Link></div></header>
    <div className="seed-width">
      <div className="seed-heading"><div><span className="seed-eyebrow">YOUR SEED-RAISING JOURNAL</span><h1>Seedling <em>Companion.</em></h1><p>Know what to start, what to check and when your next batch should be sown.</p></div><button className="seed-add" onClick={()=>setShowForm(s=>!s)}>{showForm?"Close form":"＋ Add seed batch"}</button></div>
      <div className="seed-location"><span>Default location for new batches</span><div className="seed-switch"><button className={site==="waihopai"?"selected":""} onClick={()=>setSite("waihopai")}>Waihopai Valley</button><button className={site==="blenheim"?"selected":""} onClick={()=>setSite("blenheim")}>Blenheim Central</button></div><small>Both sites currently share generic sowing windows; no site-specific forecast or soil sensor is connected</small></div>
      {showForm&&<form className="seed-form" onSubmit={submit}><h2>Start tracking a batch</h2><div className="seed-form-grid">
        <SeedCataloguePicker showVarietyOptions crop={form.crop} variety={form.variety} onChange={(crop, variety) => setForm(f => ({ ...f, crop, variety }))} />
        <label>Seeds sown<input type="number" min="1" max="9999" readOnly={mappedCells.length > 0} value={mappedCells.length || form.count} onChange={e=>setForm(f=>({...f,count:Number(e.target.value)}))}/></label>
        <label>Date sown<input type="date" required value={form.dateSown} onChange={e=>setForm(f=>({...f,dateSown:e.target.value}))}/></label>
        <label>Method<select disabled={mappedCells.length > 0} value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value as SeedBatch["method"],container:e.target.value==="direct"?"Direct in bed":f.container==="Direct in bed"?"Six-cell tray":f.container}))}><option value="indoors">Under grow light / indoors</option><option value="protected">Outside protected</option><option value="direct">Direct sow in bed</option></select></label>
        <label>Location<select value={form.site} onChange={e=>setForm(f=>({...f,site:e.target.value as SeedBatch["site"]}))}><option value="waihopai">Waihopai Valley</option><option value="blenheim">Blenheim Central</option></select></label>
        <label>Notes<input placeholder="Substrate, ventilation, soil temperature…" value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></label>
      </div><SeedContainerPicker disabled={mappedCells.length > 0} value={form.container} onChange={container=>setForm(f=>({...f,container,method:container==="Direct in bed"?"direct":f.method==="direct"&&seedContainers.some(item=>item.name===container)?"indoors":f.method}))}/>{mappedCells.length > 0 && <small>Clear the cells to switch trays or sowing methods.</small>}<SeedTrayEditor container={form.container} crop={form.crop} variety={form.variety} cells={mappedCells} onChange={cells => setForm(f => ({ ...f, cells }))} /><div className="seed-checks"><label><input type="checkbox" checked={form.covered} onChange={e=>setForm(f=>({...f,covered:e.target.checked}))}/> Ventilated cover / humidity box</label><label><input type="checkbox" checked={form.bottomWatered} onChange={e=>setForm(f=>({...f,bottomWatered:e.target.checked}))}/> Bottom-watering setup</label></div><button type="submit" className="seed-add">Save batch</button></form>}
      <div className="seed-metrics"><div><span>ACTIVE BATCHES</span><strong>{loaded?batches.filter(b=>b.stage!=="planted").length:"—"}</strong><small>Tracked on this device</small></div><div><span>OUTDOOR PLANTING WINDOWS</span><strong>{planned.filter(x=>x.outdoor).length}</strong><small>Potential sowing or transplant windows</small></div><div><span>START UNDER COVER</span><strong>{planned.filter(x=>x.indoor).length}</strong><small>Calendar-based suggestions</small></div></div>
      <section className="seed-section"><div className="seed-section-top"><div><span className="seed-eyebrow">THIS MONTH</span><h2>This month&apos;s sowing windows</h2></div><span className="seed-date">{date.toLocaleDateString("en-NZ",{month:"long",year:"numeric",timeZone:"Pacific/Auckland"})}</span></div>
        <div className="seed-crop-grid">{planned.length?planned.map(c=><article key={c.crop} className="seed-crop-card"><div className="seed-crop-top"><span className="seed-plant-glyph"><PlantArt crop={cropArtName(c.crop)} fallback="🌱" /></span><span className="seed-crop-type">{c.indoor&&c.outdoor?(c.outdoorAction==="transplant"?"Sow indoors / plant out":"Under cover / direct sow"):c.indoor?"Sow under cover":c.outdoorAction==="transplant"?"Plant out seedlings":"Direct sow"}</span></div><h3>{c.crop}</h3><p>{c.notes}</p>{c.indoor&&c.outdoor&&<small>Indoor start or outdoor sowing depending on conditions</small>}{c.intervalDays&&<div className="seed-succession">↻ Consider another sowing in ~{c.intervalDays} days</div>}<button onClick={()=>{setForm({...initialForm(),crop:c.crop,site,method:c.indoor||c.outdoorAction==="transplant"?"indoors":"direct",container:c.indoor||c.outdoorAction==="transplant"?"Six-cell tray":"Direct in bed"});setShowForm(true);window.scrollTo({top:0,behavior:"smooth"});}}>Track this crop →</button></article>):<p>There are no recommended crops for this month in the starter library. Check variety-specific sources.</p>}</div>
      </section>
      <section className="seed-section"><div className="seed-section-top"><div><span className="seed-eyebrow">YOUR GROWING BATCHES</span><h2>On the growing bench</h2></div><div className="seed-switch"><button className={filter==="all"?"selected":""} onClick={()=>setFilter("all")}>All</button><button className={filter==="indoor"?"selected":""} onClick={()=>setFilter("indoor")}>Under cover</button><button className={filter==="outdoor"?"selected":""} onClick={()=>setFilter("outdoor")}>Outside</button></div></div>
        {!visible.length?<div className="seed-empty"><span aria-hidden="true">01 /</span><h3>No batches in this view yet</h3><p>Add your first sowing to get a germination countdown, growth-stage checklist and succession date.</p><button className="seed-add" onClick={()=>setShowForm(true)}>＋ Add seed batch</button></div>:<div className="seed-batch-grid">{visible.map(b=>{const mixed = b.cells?.some(cell => cell.crop !== b.crop || cell.variety !== b.variety);const guide=mixed ? undefined : findGuide(b.crop);const step=stages.findIndex(s=>s.value===b.stage);const min=guide?addDays(b.dateSown,guide.emergenceDays[0]):null;const max=guide?addDays(b.dateSown,guide.emergenceDays[1]):null;const next=guide?.intervalDays?addDays(b.dateSown,guide.intervalDays):null;const due=next&&next<=today;
        return <article className="seed-batch-card" key={b.id}><div className="seed-batch-header"><div className="seed-batch-art"><SeedContainerArt name={b.container}/><PlantArt crop={cropArtName(b.crop)} variety={b.variety} fallback="🌱" /></div><div><span className="seed-crop-type">{b.site==="waihopai"?"Waihopai Valley":"Blenheim Central"} · {b.container}</span><h3>{mixed ? "Mixed tray" : b.crop}{!mixed && b.variety ? ` · ${b.variety}` : ""}</h3><small>{b.count} seeds · sown {formatNzDate(b.dateSown)}</small></div><button className="seed-delete" onClick={()=>{if(window.confirm("Delete this batch?"))persist(batches.filter(x=>x.id!==b.id));}} aria-label={`Delete ${b.crop} batch`}>×</button></div>
        {b.cells?.length ? <SeedTrayEditor editOnly container={b.container} crop={b.crop} variety={b.variety} cells={b.cells} onChange={cells => {
          const first = cells[0];
          if (first) patchBatch(b.id, { cells, crop: first.crop, variety: first.variety, count: cells.length });
        }} /> : null}
        <div className="seed-progress" aria-label={`Stage: ${stages[step]?.label}`}>{stages.map((s,i)=><span key={s.value} className={i<=step?"done":""}/>)}</div><div className="seed-stage-head"><strong>{stages[step]?.label}</strong><span>Stage {step+1} of {stages.length}</span></div><p className="seed-stage-hint">{stages[step]?.hint}</p>
        {b.stage==="sown"&&min&&max&&<p className="seed-milestone"><strong>Expected emergence:</strong> {formatNzDate(min)} – {formatNzDate(max)} (assuming suitable temperature)</p>}
        {next&&<p className="seed-milestone"><strong>Next succession sowing:</strong> {formatNzDate(next)}{due?" · Check conditions now":""}</p>}
        <div className="seed-batch-actions"><label>Growth stage<select value={b.stage} onChange={e=>patchBatch(b.id,{stage:e.target.value as SeedBatch["stage"]})}>{stages.map(s=><option value={s.value} key={s.value}>{s.label}</option>)}</select></label><button onClick={()=>patchBatch(b.id,{lastMoistureCheck:today})}>✓ Moisture checked</button></div>
        <p className="seed-check-note">{b.lastMoistureCheck?`Last checked ${formatNzDate(b.lastMoistureCheck)}`:"No moisture check recorded"} · Check the mix before watering; drain excess water after bottom watering.</p>
        <div className="seed-batch-options"><label><input type="checkbox" checked={b.covered} onChange={e=>patchBatch(b.id,{covered:e.target.checked})}/> Covered</label><label><input type="checkbox" checked={b.bottomWatered} onChange={e=>patchBatch(b.id,{bottomWatered:e.target.checked})}/> Bottom-water setup</label></div>
        </article>;})}</div>}
      </section>
      <section className="seed-section seed-reference"><div><span className="seed-eyebrow">SEEDLING STAGES</span><h2>Know what to look for</h2><p>Use visible growth rather than a fixed date to decide when to transplant or pot on.</p></div><div className="seed-stage-guide">{stages.slice(0,5).map((s,i)=><div key={s.value}><span className="seed-stage-number">{String(i+1).padStart(2,"0")}</span><SeedStageSketch stage={s.value}/><strong>{s.label}</strong><p>{s.hint}</p></div>)}</div><p className="seed-stage-caption">Illustrative stages only; leaf shapes and timing differ by crop and variety.</p></section>
      <footer className="seed-disclaimer"><p><strong>Planning preview:</strong> Guidance is generic and seasonal, not a verified Kings Seeds variety record or live forecast. This version stores batches in this browser only; syncing, photo uploads, live weather and iOS push reminders are future additions. Confirm temperatures, moisture, frost forecasts and supplier directions before acting.</p><p>One Sansi 36W grow light · no heat mat · New Zealand growing calendar</p><Link href="/">← Back to garden homepage</Link></footer>
    </div>
  </main>;
}
