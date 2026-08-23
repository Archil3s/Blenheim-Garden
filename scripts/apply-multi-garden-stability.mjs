import fs from "node:fs";

function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Missing patch target: ${label}`);
  return source.replace(needle, replacement);
}

// Parameterize the existing planner API by garden id. The D1 schema already scopes rows by garden_id.
{
  const file = "app/api/garden/route.ts";
  let source = fs.readFileSync(file, "utf8");

  source = replaceOnce(
    source,
    `function authorised(request: Request) {`,
    `function gardenIdFromRequest(request: Request) {\n  const value = new URL(request.url).searchParams.get("gardenId")?.trim() || GARDEN_ID;\n  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)) throw new Error("Garden id is invalid.");\n  return value;\n}\n\nfunction authorised(request: Request) {`,
    "garden id helper",
  );

  source = replaceOnce(
    source,
    `export async function GET() {\n  try {\n    const db = getGardenDb();`,
    `export async function GET(request: Request) {\n  try {\n    const gardenId = gardenIdFromRequest(request);\n    const db = getGardenDb();`,
    "GET garden id",
  );

  source = replaceOnce(
    source,
    `  try {\n    const body = await request.json();\n    const plan = parsePlan((body as { plan?: unknown })?.plan);`,
    `  try {\n    const gardenId = gardenIdFromRequest(request);\n    const body = await request.json();\n    const plan = parsePlan((body as { plan?: unknown })?.plan);`,
    "PUT garden id",
  );

  source = source.replaceAll(".bind(GARDEN_ID", ".bind(gardenId");

  source = replaceOnce(
    source,
    `    if (statements.length) await db.batch(statements);\n    return Response.json({ ok: true, savedAt: new Date().toISOString() });`,
    `    statements.push(db.prepare("UPDATE gardens SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(gardenId));\n    if (statements.length) await db.batch(statements);\n    return Response.json({ ok: true, gardenId, savedAt: new Date().toISOString() });`,
    "garden updated timestamp",
  );

  source = replaceOnce(
    source,
    `    return Response.json({ ok: true, source: "d1", plan: { beds, plantingAreas, rows, objects } });`,
    `    return Response.json({ ok: true, source: "d1", gardenId, plan: { beds, plantingAreas, rows, objects } });`,
    "GET response garden id",
  );

  fs.writeFileSync(file, source);
}

// Scope browser-local planner state and cloud load/save to the selected garden.
{
  const file = "components/garden-planner.tsx";
  let source = fs.readFileSync(file, "utf8");

  source = replaceOnce(
    source,
    `import { plantCountForArea, plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";`,
    `import { plantCountForArea, plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";\nimport { DEFAULT_GARDEN_ID, LIVE_PLAN_EVENT, gardenLivePlanKey, gardenLocalPlanKey, readActiveGardenId } from "@/lib/garden/active-garden";`,
    "planner active garden import",
  );

  source = source.replace(`const LOCAL_PLAN_KEY = "blenheim-garden-plan";\nconst LIVE_PLAN_KEY = "blenheim-garden-live-plan";\nconst LIVE_PLAN_EVENT = "blenheim-garden-live-plan-change";\n`, "");

  source = replaceOnce(
    source,
    `const basePlan: PlanState = { beds: baseBeds, plantingAreas: basePlantingAreas, rows: [], objects: baseObjects };`,
    `const basePlan: PlanState = { beds: baseBeds, plantingAreas: basePlantingAreas, rows: [], objects: baseObjects };\nconst emptyPlan: PlanState = { beds: [], plantingAreas: [], rows: [], objects: [] };`,
    "empty plan",
  );

  source = replaceOnce(
    source,
    `function readLocalPlan() {\n  try { return normalisePlan(JSON.parse(localStorage.getItem(LOCAL_PLAN_KEY) ?? "null") as Partial<PlanState>); } catch { return null; }\n}`,
    `function readLocalPlan(gardenId: string) {\n  try { return normalisePlan(JSON.parse(localStorage.getItem(gardenLocalPlanKey(gardenId)) ?? "null") as Partial<PlanState>); } catch { return null; }\n}`,
    "planner local plan helper",
  );

  const oldLoad = `  useEffect(() => {\n    let cancelled = false;\n    const local = readLocalPlan();\n    if (local) { setPlan(local); setLoadSource("local"); } else setLoadSource("default");\n    void (async () => {\n      try {\n        const response = await fetch("/api/garden", { cache: "no-store" });\n        const data = await response.json() as GardenPlanApiResponse;\n        const cloud = normalisePlan(data.plan);\n        if (cancelled || !response.ok || !data.ok || !cloud || cloud.beds.length === 0) return;\n        setPlan(cloud);\n        localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(cloud));\n        setLoadSource("cloud");\n      } catch { /* keep local plan */ }\n    })();\n    return () => { cancelled = true; };\n  }, []);`;
  const newLoad = `  useEffect(() => {\n    let cancelled = false;\n    const gardenId = readActiveGardenId();\n    const local = readLocalPlan(gardenId);\n    if (local) {\n      setPlan(local);\n      setLoadSource("local");\n    } else {\n      setPlan(gardenId === DEFAULT_GARDEN_ID ? clonePlan(basePlan) : clonePlan(emptyPlan));\n      setSelection(gardenId === DEFAULT_GARDEN_ID ? { kind: "bed", id: "1" } : null);\n      setLoadSource("default");\n    }\n    void (async () => {\n      try {\n        const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(gardenId)}`, { cache: "no-store" });\n        const data = await response.json() as GardenPlanApiResponse;\n        const cloud = normalisePlan(data.plan);\n        if (cancelled || !response.ok || !data.ok || !cloud) return;\n        setPlan(cloud);\n        setSelection(cloud.beds.length ? { kind: "bed", id: String(cloud.beds[0].id) } : null);\n        localStorage.setItem(gardenLocalPlanKey(gardenId), JSON.stringify(cloud));\n        setLoadSource("cloud");\n      } catch { /* keep local or blank plan */ }\n    })();\n    return () => { cancelled = true; };\n  }, []);`;
  source = replaceOnce(source, oldLoad, newLoad, "planner initial load");

  source = replaceOnce(
    source,
    `      localStorage.setItem(LIVE_PLAN_KEY, JSON.stringify(plan));\n      window.dispatchEvent(new CustomEvent(LIVE_PLAN_EVENT, { detail: plan }));`,
    `      const gardenId = readActiveGardenId();\n      localStorage.setItem(gardenLivePlanKey(gardenId), JSON.stringify(plan));\n      window.dispatchEvent(new CustomEvent(LIVE_PLAN_EVENT, { detail: { gardenId, plan } }));`,
    "planner live plan publish",
  );

  source = replaceOnce(
    source,
    `  async function savePlan() {\n    localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(plan)); setSaveState("saving");`,
    `  async function savePlan() {\n    const gardenId = readActiveGardenId();\n    localStorage.setItem(gardenLocalPlanKey(gardenId), JSON.stringify(plan)); setSaveState("saving");`,
    "planner save local key",
  );

  source = replaceOnce(
    source,
    `      const response = await fetch("/api/garden", { method: "PUT", headers: { "content-type": "application/json", authorization: \`Bearer \${editKey}\` }, body: JSON.stringify({ plan }) });`,
    `      const response = await fetch(\`/api/garden?gardenId=\${encodeURIComponent(gardenId)}\`, { method: "PUT", headers: { "content-type": "application/json", authorization: \`Bearer \${editKey}\` }, body: JSON.stringify({ plan }) });`,
    "planner save cloud garden",
  );

  fs.writeFileSync(file, source);
}

// Make WebGL garden-specific and substantially lighter so dense plantings cannot crash the page.
{
  const file = "components/garden-webgl.tsx";
  let source = fs.readFileSync(file, "utf8");

  source = replaceOnce(
    source,
    `import { plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";`,
    `import { plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";\nimport { DEFAULT_GARDEN_ID, LIVE_PLAN_EVENT, gardenLivePlanKey, gardenLocalPlanKey, readActiveGardenId } from "@/lib/garden/active-garden";`,
    "webgl active garden import",
  );

  source = source.replace(`const LOCAL_PLAN_KEY = "blenheim-garden-plan";\nconst LIVE_PLAN_KEY = "blenheim-garden-live-plan";\nconst LIVE_PLAN_EVENT = "blenheim-garden-live-plan-change";\n`, "");

  source = source.replace("plantPositionsForArea(area, areaW, areaH, 240)", "plantPositionsForArea(area, areaW, areaH, 72)");
  source = source.replace("const total = Math.min(160, Math.max(1, row.count));", "const total = Math.min(48, Math.max(1, row.count));");
  source = source.replace("renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));", "renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));");
  source = source.replace("sun.shadow.mapSize.set(2048, 2048);", "sun.shadow.mapSize.set(1024, 1024);");

  source = replaceOnce(
    source,
    `function readLocalPlan() { return readPlanFromStorage(LOCAL_PLAN_KEY); }\nfunction readLivePlan() { return readPlanFromStorage(LIVE_PLAN_KEY); }`,
    `function readLocalPlan(gardenId: string) { return readPlanFromStorage(gardenLocalPlanKey(gardenId)); }\nfunction readLivePlan(gardenId: string) { return readPlanFromStorage(gardenLivePlanKey(gardenId)); }`,
    "webgl storage helpers",
  );

  source = replaceOnce(
    source,
    `  const [plan, setPlan] = useState<PlannerPlan | null>(null);\n  const [source, setSource] = useState("Loading garden…");`,
    `  const [plan, setPlan] = useState<PlannerPlan | null>(null);\n  const [gardenId, setGardenId] = useState(DEFAULT_GARDEN_ID);\n  const [source, setSource] = useState("Loading garden…");\n  const [renderError, setRenderError] = useState<string | null>(null);`,
    "webgl garden state",
  );

  const oldLoad = `  useEffect(() => {\n    let cancelled = false;\n    async function load() {\n      const live = readLivePlan();\n      if (live) {\n        if (!cancelled) {\n          setPlan(live);\n          setSource("Live 2D planner");\n        }\n        return;\n      }\n      try {\n        const response = await fetch("/api/garden", { cache: "no-store" });\n        const data = (await response.json()) as GardenPlanApiResponse;\n        if (response.ok && data.ok && data.plan) {\n          if (!cancelled) {\n            setPlan(data.plan);\n            setSource("Live D1 garden");\n          }\n          return;\n        }\n      } catch {\n        // Fall through to local plan.\n      }\n      const local = readLocalPlan();\n      if (!cancelled && local) {\n        setPlan(local);\n        setSource("Local planner copy");\n      } else if (!cancelled) {\n        setSource("Garden data unavailable");\n      }\n    }\n    load();\n    return () => {\n      cancelled = true;\n    };\n  }, []);`;
  const newLoad = `  useEffect(() => {\n    let cancelled = false;\n    const fromQuery = new URL(window.location.href).searchParams.get("gardenId")?.trim();\n    const selectedGardenId = fromQuery || readActiveGardenId();\n    setGardenId(selectedGardenId);\n    async function load() {\n      const live = readLivePlan(selectedGardenId);\n      if (live) {\n        if (!cancelled) { setPlan(live); setSource("Live 2D planner"); }\n        return;\n      }\n      try {\n        const response = await fetch(\`/api/garden?gardenId=\${encodeURIComponent(selectedGardenId)}\`, { cache: "no-store" });\n        const data = (await response.json()) as GardenPlanApiResponse;\n        if (response.ok && data.ok && data.plan) {\n          if (!cancelled) { setPlan(data.plan); setSource("Live D1 garden"); }\n          return;\n        }\n      } catch {\n        // Fall through to local plan.\n      }\n      const local = readLocalPlan(selectedGardenId);\n      if (!cancelled && local) {\n        setPlan(local);\n        setSource("Local planner copy");\n      } else if (!cancelled) {\n        setPlan({ beds: [], plantingAreas: [], rows: [], objects: [] });\n        setSource("Empty garden");\n      }\n    }\n    void load();\n    return () => { cancelled = true; };\n  }, []);`;
  source = replaceOnce(source, oldLoad, newLoad, "webgl initial load");

  const oldSync = `  useEffect(() => {\n    const applyPlan = (candidate: PlannerPlan | null) => {\n      if (!candidate) return;\n      setPlan(candidate);\n      setSource("Live 2D planner");\n    };\n    const onStorage = (event: StorageEvent) => {\n      if (event.key === LIVE_PLAN_KEY) applyPlan(readLivePlan());\n    };\n    const onLivePlan = (event: Event) => {\n      const detail = (event as CustomEvent<PlannerPlan>).detail;\n      if (detail && Array.isArray(detail.beds) && Array.isArray(detail.rows)) applyPlan(detail);\n      else applyPlan(readLivePlan());\n    };\n    window.addEventListener("storage", onStorage);\n    window.addEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);\n    return () => {\n      window.removeEventListener("storage", onStorage);\n      window.removeEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);\n    };\n  }, []);`;
  const newSync = `  useEffect(() => {\n    let timer: number | null = null;\n    let pending: PlannerPlan | null = null;\n    const applyNow = () => {\n      timer = null;\n      if (!pending) return;\n      setPlan(pending);\n      setSource("Live 2D planner");\n      pending = null;\n    };\n    const schedulePlan = (candidate: PlannerPlan | null) => {\n      if (!candidate) return;\n      pending = candidate;\n      if (timer === null) timer = window.setTimeout(applyNow, 70);\n    };\n    const liveKey = gardenLivePlanKey(gardenId);\n    const onStorage = (event: StorageEvent) => {\n      if (event.key === liveKey) schedulePlan(readLivePlan(gardenId));\n    };\n    const onLivePlan = (event: Event) => {\n      const detail = (event as CustomEvent<{ gardenId?: string; plan?: PlannerPlan }>).detail;\n      if (detail?.gardenId === gardenId && detail.plan) schedulePlan(detail.plan);\n      else schedulePlan(readLivePlan(gardenId));\n    };\n    window.addEventListener("storage", onStorage);\n    window.addEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);\n    return () => {\n      if (timer !== null) window.clearTimeout(timer);\n      window.removeEventListener("storage", onStorage);\n      window.removeEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);\n    };\n  }, [gardenId]);`;
  source = replaceOnce(source, oldSync, newSync, "webgl live sync");

  source = replaceOnce(
    source,
    `    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });`,
    `    let renderer: THREE.WebGLRenderer;\n    try {\n      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });\n      setRenderError(null);\n    } catch {\n      setRenderError("WebGL could not start in this browser. Try reloading the page or enabling hardware acceleration.");\n      return;\n    }`,
    "webgl renderer guard",
  );

  source = replaceOnce(
    source,
    `          {!plan && <div className={styles.loading}>{source}</div>}`,
    `          {renderError && <div className={styles.loading}>{renderError}</div>}\n          {!renderError && !plan && <div className={styles.loading}>{source}</div>}`,
    "webgl error UI",
  );

  source = source.replace(
    `<a href="/" className={styles.back}>← 2D Plan</a>`,
    `<a href={\`/?gardenId=\${encodeURIComponent(gardenId)}\`} className={styles.back}>← 2D Plan</a>`,
  );

  fs.writeFileSync(file, source);
}

// Keep the launch button tied to the same active garden id.
// (The bridge is also edited directly in this branch, so this is only a sanity check.)

// Document the storage behavior.
{
  const file = "PROJECT_CONTEXT.md";
  let source = fs.readFileSync(file, "utf8");
  if (!source.includes("## Multiple named gardens")) {
    source += `\n\n## Multiple named gardens\n\nThe D1 schema already supported multiple garden ids. The planner now stores the selected garden id in browser local storage, scopes local/live plan caches by garden id, sends gardenId to /api/garden, and exposes /api/gardens for listing and creating named blank gardens. Live 3D uses the same garden id. New gardens start blank and do not overwrite the original Blenheim Garden.\n\nWebGL dense planting rendering is deliberately capped and live updates are throttled to keep the browser stable while preserving the real saved plant counts in planner data.\n`;
    fs.writeFileSync(file, source);
  }
}

for (const path of ["scripts/apply-multi-garden-stability.mjs", ".github/workflows/apply-multi-garden-stability.yml"]) {
  if (fs.existsSync(path)) fs.rmSync(path);
}
