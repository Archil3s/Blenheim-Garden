import fs from "node:fs";

function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Could not find ${label}`);
  return source.replace(needle, replacement);
}

const plannerPath = "components/garden-planner.tsx";
let planner = fs.readFileSync(plannerPath, "utf8");
if (!planner.includes('const LIVE_PLAN_KEY = "blenheim-garden-live-plan";')) {
  planner = replaceOnce(
    planner,
    'const LOCAL_PLAN_KEY = "blenheim-garden-plan";\nconst EDIT_KEY_SESSION = "blenheim-garden-edit-key";',
    'const LOCAL_PLAN_KEY = "blenheim-garden-plan";\nconst LIVE_PLAN_KEY = "blenheim-garden-live-plan";\nconst LIVE_PLAN_EVENT = "blenheim-garden-live-plan-change";\nconst EDIT_KEY_SESSION = "blenheim-garden-edit-key";',
    "planner storage constants",
  );

  planner = replaceOnce(
    planner,
    '  }, []);\n\n  const selectedBed = selection?.kind === "bed"',
    `  }, []);\n\n  // Publish every in-memory planner change for the WebGL companion.\n  // This does not save to D1 and does not change the normal Save workflow.\n  useEffect(() => {\n    if (loadSource === "starting") return;\n    try {\n      localStorage.setItem(LIVE_PLAN_KEY, JSON.stringify(plan));\n      window.dispatchEvent(new CustomEvent(LIVE_PLAN_EVENT, { detail: plan }));\n    } catch {\n      // Live preview is best-effort; planner editing must keep working if storage is unavailable.\n    }\n  }, [plan, loadSource]);\n\n  const selectedBed = selection?.kind === "bed"`,
    "planner live plan effect",
  );
  fs.writeFileSync(plannerPath, planner);
}

const webglPath = "components/garden-webgl.tsx";
let webgl = fs.readFileSync(webglPath, "utf8");
if (!webgl.includes('const LIVE_PLAN_KEY = "blenheim-garden-live-plan";')) {
  webgl = replaceOnce(
    webgl,
    'const LOCAL_PLAN_KEY = "blenheim-garden-plan";',
    'const LOCAL_PLAN_KEY = "blenheim-garden-plan";\nconst LIVE_PLAN_KEY = "blenheim-garden-live-plan";\nconst LIVE_PLAN_EVENT = "blenheim-garden-live-plan-change";',
    "WebGL storage constants",
  );

  const oldReader = `function readLocalPlan(): PlannerPlan | null {\n  try {\n    const parsed = JSON.parse(localStorage.getItem(LOCAL_PLAN_KEY) ?? "null") as Partial<PlannerPlan> | null;\n    if (!parsed || !Array.isArray(parsed.beds) || !Array.isArray(parsed.rows)) return null;\n    return {\n      beds: parsed.beds,\n      plantingAreas: Array.isArray(parsed.plantingAreas) ? parsed.plantingAreas : [],\n      rows: parsed.rows,\n      objects: Array.isArray(parsed.objects) ? parsed.objects : [],\n    };\n  } catch {\n    return null;\n  }\n}`;
  const newReader = `function readPlanFromStorage(key: string): PlannerPlan | null {\n  try {\n    const parsed = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<PlannerPlan> | null;\n    if (!parsed || !Array.isArray(parsed.beds) || !Array.isArray(parsed.rows)) return null;\n    return {\n      beds: parsed.beds,\n      plantingAreas: Array.isArray(parsed.plantingAreas) ? parsed.plantingAreas : [],\n      rows: parsed.rows,\n      objects: Array.isArray(parsed.objects) ? parsed.objects : [],\n    };\n  } catch {\n    return null;\n  }\n}\n\nfunction readLocalPlan() { return readPlanFromStorage(LOCAL_PLAN_KEY); }\nfunction readLivePlan() { return readPlanFromStorage(LIVE_PLAN_KEY); }`;
  webgl = replaceOnce(webgl, oldReader, newReader, "WebGL storage reader");

  webgl = replaceOnce(
    webgl,
    '    async function load() {\n      try {',
    `    async function load() {\n      const live = readLivePlan();\n      if (live) {\n        if (!cancelled) {\n          setPlan(live);\n          setSource("Live 2D planner");\n        }\n        return;\n      }\n      try {`,
    "WebGL initial live plan load",
  );

  webgl = replaceOnce(
    webgl,
    '  }, []);\n\n  const activeByBed = useMemo(() => {',
    `  }, []);\n\n  // Keep a separate 3D window synchronized with unsaved edits in the planner.\n  useEffect(() => {\n    const applyPlan = (candidate: PlannerPlan | null) => {\n      if (!candidate) return;\n      setPlan(candidate);\n      setSource("Live 2D planner");\n    };\n    const onStorage = (event: StorageEvent) => {\n      if (event.key === LIVE_PLAN_KEY) applyPlan(readLivePlan());\n    };\n    const onLivePlan = (event: Event) => {\n      const detail = (event as CustomEvent<PlannerPlan>).detail;\n      if (detail && Array.isArray(detail.beds) && Array.isArray(detail.rows)) applyPlan(detail);\n      else applyPlan(readLivePlan());\n    };\n    window.addEventListener("storage", onStorage);\n    window.addEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);\n    return () => {\n      window.removeEventListener("storage", onStorage);\n      window.removeEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);\n    };\n  }, []);\n\n  const activeByBed = useMemo(() => {`,
    "WebGL live plan listener",
  );

  webgl = webgl.replace("WebGL garden twin", "Live WebGL garden twin");
  webgl = webgl.replace("First WebGL pass", "Live garden mirror");
  webgl = webgl.replace(
    "Uses the same D1 planner geometry and centimetre plant spacing as the 2D garden. No new storage schema.",
    "Mirrors the exact in-memory 2D design, including unsaved moves and resizing. Save still controls D1 persistence.",
  );
  fs.writeFileSync(webglPath, webgl);
}

const launchPath = "components/webgl-launch-bridge.tsx";
let launch = fs.readFileSync(launchPath, "utf8");
launch = launch.replace(
  'button.title = "Open the interactive WebGL garden";',
  'button.title = "Open a live 3D companion window";',
);
launch = launch.replace(
  '        window.location.assign("/3d");',
  '        const companion = window.open("/3d", "blenheim-garden-live-3d");\n        companion?.focus();',
);
launch = launch.replace('button.textContent = "3D";', 'button.textContent = "Live 3D";');
fs.writeFileSync(launchPath, launch);

const contextPath = "PROJECT_CONTEXT.md";
let context = fs.readFileSync(contextPath, "utf8");
if (!context.includes("## Live WebGL design mirror")) {
  context += `\n\n## Live WebGL design mirror\n\nThe **Live 3D** planner action opens \`/3d\` as a companion window. The 2D planner publishes its current in-memory \`PlannerPlan\` to a separate local live-preview key on every plan change; this does **not** write D1. The WebGL view listens for those changes and rebuilds the scene from the same bed, planting-area, row, path, trellis and tree coordinates, so unsaved edits appear in 3D immediately. Normal **Save** remains the only planner action that persists the design through the protected garden API.\n`;
  fs.writeFileSync(contextPath, context);
}

// This is intentionally a one-shot repository patcher. Remove it and its workflow in the resulting commit.
for (const path of ["scripts/apply-live-webgl-sync.mjs", ".github/workflows/apply-live-webgl-sync.yml"]) {
  if (fs.existsSync(path)) fs.rmSync(path);
}
