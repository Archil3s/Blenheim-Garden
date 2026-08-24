# AGENTS.md — Blenheim Garden Autonomous Development Contract

This file is the operating contract for coding agents working in `Archil3s/Blenheim-Garden`.

The application is highly visual. A successful compile is **not** sufficient evidence that a change is correct. For any user-interface, layout, interaction, canvas, sprite, responsive, WebGL, or styling change, visual verification in a real browser is part of the definition of done.

---

## 1. Read this first

Before changing code:

1. Read this `AGENTS.md` completely.
2. Read `PROJECT_CONTEXT.md` completely.
3. Read `README.md` for the current public project state.
4. Inspect the files involved in the requested feature/fix before editing them.
5. Inspect recent relevant code rather than assuming old architecture still applies.

Do not replace current architecture with a guessed older version.

---

## 2. Product invariant

Blenheim Garden is a visual home-garden planner for Blenheim, Marlborough.

The **measured garden canvas is the application**.

Preserve these priorities unless the user explicitly changes them:

- the garden canvas stays visually dominant;
- controls remain compact and understandable;
- the interface should feel like a simple visual garden planner, not an admin dashboard;
- preserve the measured physical garden layout and the existing 12-bed base garden;
- preserve real centimetre-based spacing and planner coordinates;
- preserve Drawing Interface V2 behaviour;
- preserve D1 persistence and archived-bed history;
- preserve private R2 media behaviour and quotas;
- preserve protected writes using `GARDEN_WRITE_TOKEN`;
- preserve Today / This Week Blenheim guidance;
- preserve Rotation history;
- preserve Notes & Harvests;
- preserve named-garden separation;
- preserve the `/3d` companion view and live-plan mirroring unless a task explicitly targets it.

Do not copy proprietary GrowVeg code or artwork. A similar interaction model and visual clarity are acceptable; implementation and assets must be original or appropriately licensed.

---

## 3. Safety and repository rules

- Production branch is `main`.
- Never force-push.
- Never rewrite remote history.
- Never commit secrets, tokens, credentials, `.env` contents, Cloudflare secrets, or `GARDEN_WRITE_TOKEN`.
- Do not destructively delete persistent garden/history data to solve a UI problem.
- Do not add a duplicate non-idempotent D1 migration for schema already bootstrapped at runtime without first checking the existing migration/bootstrap state.
- Do not remove Cloudflare DB/R2 bindings from `wrangler.jsonc`.
- Keep package `build` as the normal Next.js build unless the project architecture intentionally changes.
- Prefer small, reversible changes over broad rewrites.
- Never hide a bug by disabling the affected feature, swallowing errors, or deleting tests.

---

## 4. Required autonomous work loop

For every task, use this loop until the requested behaviour is verified or a genuine external blocker is identified.

```text
UNDERSTAND
   ↓
INSPECT CURRENT CODE
   ↓
REPRODUCE / CAPTURE CURRENT STATE
   ↓
MAKE SMALLEST USEFUL CHANGE
   ↓
LINT / TYPE / BUILD
   ↓
RUN APP IN REAL BROWSER
   ↓
CAPTURE SCREENSHOTS + DIAGNOSTICS
   ↓
COMPARE EXPECTED vs CURRENT
   ↓
FIX ROOT CAUSE
   ↓
RETEST
   ↓
REPEAT UNTIL PASS
```

Do not stop after the first plausible patch.

If the build fails, fix it and rerun it.
If the build passes but the page is visually broken, the task is still failing.
If the screenshot looks correct but required interaction is broken, the task is still failing.

---

## 5. Mandatory validation commands

At minimum, after meaningful code changes run:

```bash
bun install
bun run lint
bun run build
```

If dependencies are already installed and unchanged, `bun install` may be skipped locally, but CI must remain able to install from a clean checkout.

For UI work, also run the visual/browser checks described below.

Do not mark work complete while known lint/build/browser errors remain unless they are verified pre-existing and unrelated; document any such exception precisely.

---

## 6. Visual verification is mandatory

Visual changes must be verified using a real Chromium browser, preferably Playwright.

### Required viewports

Unless a task is explicitly limited to one form factor, capture at least:

| Name | Viewport |
|---|---:|
| Desktop | 1920 × 1080 |
| Laptop | 1440 × 900 |
| Tablet | 1024 × 768 |
| Mobile | 390 × 844 |

The laptop view is especially important because it catches canvas/sidebar collisions that can be hidden on a large desktop monitor.

### Core visual surfaces

For changes that could affect them, verify:

- `/` main 2D planner;
- title bar and quick bar;
- left drawing rail;
- inspector/tool panel;
- measured garden canvas and rulers/grid;
- selected objects and edit handles;
- Plants workflow and plant artwork;
- Today / This Week drawer;
- Rotation overview and bed history drawer;
- Notes & Harvests dialog;
- Photos/media dialog when relevant;
- named-garden switching when relevant;
- `/3d` when shared layout/state/plant rendering could be affected.

Do not mechanically screenshot every surface for an unrelated backend-only change. Select the surfaces affected by the change, but UI changes must always have browser evidence.

---

## 7. Visual regression tooling

If Playwright visual tooling is not present, establishing it is a priority before large UI work continues.

Preferred structure:

```text
playwright.config.ts
tests/
  visual/
    garden.spec.ts
    helpers/
      diagnostics.ts
      visual-debug.ts
  visual-baselines/
visual-artifacts/
  current/
  diff/
  diagnostics/
```

The exact names may be adjusted to fit Playwright conventions, but keep baseline/current/diff evidence clearly separated.

Recommended package scripts once tooling exists:

```json
{
  "visual:test": "playwright test tests/visual",
  "visual:update": "playwright test tests/visual --update-snapshots",
  "visual:report": "playwright show-report"
}
```

Install Chromium in CI when required.

### Baseline rule

A baseline represents a **known-good intended interface**, not merely the newest screenshot.

Never update visual baselines just to make a failing test green.

Update a baseline only when:

1. the visual change is intentional;
2. the new rendering has been inspected;
3. interactions still work;
4. responsive layouts still work;
5. the new state is accepted as the new expected UI.

---

## 8. Deterministic screenshot rules

Visual tests should reduce noise so a diff represents a real regression.

Where practical:

- wait for the page and planner to finish rendering before capture;
- wait for fonts/assets required by the page;
- disable animations/transitions during screenshot assertions;
- use a stable viewport and device scale factor;
- avoid random data in the reference scene;
- use known fixture/local state where possible;
- mask genuinely dynamic values only when necessary;
- do not mask the canvas, toolbar, panels, plant imagery, or other areas that are actually under test;
- capture full-page images when page overflow is relevant;
- also capture the planner region directly when fine layout differences matter.

If cloud data makes a screenshot non-deterministic, create a safe deterministic visual-test state rather than weakening the assertion until it becomes meaningless.

---

## 9. Required visual diagnostics

A visual test failure should produce evidence useful to another developer or agent.

When possible save:

```text
visual-artifacts/
├── current/
│   ├── desktop.png
│   ├── laptop.png
│   ├── tablet.png
│   └── mobile.png
├── diff/
│   └── ...diff images...
└── diagnostics/
    ├── layout.json
    ├── console-errors.txt
    ├── page-errors.txt
    ├── network-errors.txt
    └── debug-overlay.png
```

The exact artifact location can follow Playwright defaults, but CI must upload the evidence when a visual test fails.

### `layout.json`

For relevant major elements collect useful geometry such as:

```json
{
  "viewport": { "width": 1440, "height": 900 },
  "document": { "width": 1440, "height": 900 },
  "canvas": { "x": 250, "y": 110, "width": 1080, "height": 720 },
  "sidebar": { "x": 0, "y": 110, "width": 240, "height": 790 },
  "horizontalOverflow": 0
}
```

Do not hard-code those sample numbers as expected production geometry; they illustrate the diagnostic shape only.

### Detect these conditions automatically where practical

- `document.documentElement.scrollWidth > viewport width` unexpectedly;
- horizontal overflow;
- canvas clipped outside its intended viewport/container;
- toolbar overlapping the garden canvas;
- sidebar or inspector covering interactive canvas unexpectedly;
- controls outside the viewport;
- zero-size or invisible critical controls;
- unexpected element overlap;
- sprites/images extending outside a clip container unexpectedly;
- broken image resources;
- browser console errors;
- uncaught page errors;
- failed important network requests;
- hydration/runtime exceptions;
- WebGL context/renderer failures on `/3d`.

---

## 10. Debug-overlay screenshot

For difficult layout failures, generate a second screenshot that visually annotates key regions.

The debug overlay should use temporary browser-injected CSS/DOM only; do not ship diagnostic boxes in production UI.

Recommended boxes/labels:

- viewport bounds;
- title bar;
- quick bar;
- drawing rail;
- inspector/tool panel;
- planner viewport;
- garden canvas;
- selected object bounds;
- relevant dialog/drawer;
- any element detected outside parent bounds.

Add element name and `x/y/w/h` where useful.

This screenshot is diagnostic evidence, not a replacement for the clean screenshot.

---

## 11. Screenshot comparison workflow

For a UI task, the agent should reason from three images whenever a stable baseline exists:

```text
BASELINE / EXPECTED
        +
CURRENT RENDER
        +
PIXEL DIFF
        ↓
ROOT-CAUSE INVESTIGATION
```

Do not treat every pixel difference as a bug. Anti-aliasing and platform rendering can create minor noise. Prefer thresholds small enough to catch meaningful movement while avoiding meaningless pixel churn.

If the visual change is large, inspect it before increasing thresholds.

Never solve a real visual regression by simply making the screenshot threshold permissive.

---

## 12. Root-cause order for visual failures

When the UI is visually broken, investigate systematically.

### A. Browser/runtime first

Check:

1. page exceptions;
2. hydration errors;
3. console errors;
4. failed network requests;
5. missing CSS/assets/images;
6. loading state stuck forever.

### B. Layout next

Check computed geometry for:

1. viewport/document overflow;
2. parent width/height;
3. `position` / containing block;
4. flex/grid constraints;
5. `min-width: 0` / `min-height: 0` problems;
6. fixed/absolute positioning;
7. transforms and scale;
8. stacking context / `z-index`;
9. clipping / `overflow`;
10. responsive media queries.

### C. Planner coordinate system

If beds/plants/paths move incorrectly, verify:

- centimetre-to-screen conversion;
- zoom transforms;
- pan transforms;
- canvas origin;
- percentage geometry;
- container resize calculations;
- pointer-to-canvas coordinate conversion;
- saved plan values versus rendered values.

Do not patch individual bed positions when the coordinate transform is wrong globally.

### D. Images / plant sprites

Check:

- source path and HTTP status;
- natural image dimensions;
- explicit rendered dimensions;
- `object-fit` / `object-position`;
- clipping parent;
- transform origin;
- pixel density;
- fallback behaviour;
- stacking order.

### E. WebGL

For `/3d`, check:

- WebGL context creation;
- renderer size;
- device pixel ratio;
- camera aspect after resize;
- persistent renderer lifecycle;
- scene rebuild boundaries;
- texture loading;
- current garden ID/live-plan key;
- object coordinate conversion.

Do not repeatedly recreate the renderer during normal live plan updates.

---

## 13. Interaction verification

A screenshot alone does not prove the planner works.

For interaction changes, test the relevant user flow in the browser, for example:

- select an object;
- drag/move it;
- resize where supported;
- switch tools;
- create a row/bed/path/trellis/tree/text object where relevant;
- choose a crop;
- verify the expected plant rendering;
- Undo/Redo;
- zoom;
- toggle snap;
- open/close drawers/dialogs;
- Save when a safe test environment is available;
- refresh and verify persistence when persistence is the feature under test.

Do not write destructive data into production merely to satisfy an automated test.

---

## 14. Responsive acceptance criteria

At all required viewports:

- no accidental horizontal page scroll;
- primary controls remain reachable;
- canvas is not permanently obscured by panels;
- dialogs fit on screen or scroll internally;
- text does not overlap controls;
- buttons do not collapse to unusable hit targets;
- the planner remains understandable without requiring browser zoom;
- important state indicators remain visible;
- mobile adaptations must not silently remove core functionality unless intentionally designed that way.

---

## 15. GitHub Actions visual check

The repository currently has a normal Build workflow. Preserve it.

Add or maintain a separate visual/browser job or workflow so a successful compile cannot hide a broken interface.

A preferred CI sequence is:

```text
checkout
  ↓
setup Bun
  ↓
bun install
  ↓
bun run build
  ↓
install Playwright Chromium
  ↓
start app
  ↓
run Playwright visual tests
  ↓
upload report/screenshots/diffs on failure
```

The visual job should fail on material visual regressions, browser exceptions, or required interaction failures.

Upload Playwright HTML/report/test artifacts on failure so the cause can be inspected without rerunning locally.

---

## 16. Do not overfit tests to the implementation

Test user-visible behaviour and stable layout invariants.

Avoid brittle assertions tied to incidental React implementation details.

Prefer:

- accessible roles/names;
- stable `data-testid` values where semantic selectors are insufficient;
- visible outcomes;
- bounding geometry of important regions;
- actual interaction results.

Do not use long arbitrary sleeps. Wait on meaningful UI/application state.

---

## 17. Fix strategy

When a regression is found:

1. reproduce it at the failing viewport;
2. preserve a current screenshot before the fix;
3. locate the first incorrect layout/runtime state;
4. identify root cause;
5. make the smallest coherent fix;
6. rerun the exact failing test first;
7. rerun all relevant viewports;
8. rerun lint/build;
9. verify no neighbouring feature regressed.

Do not stack speculative CSS overrides until the screenshot looks approximately right.

Prefer fixing the layout model that produced the incorrect geometry.

---

## 18. Completion gate

A UI task is complete only when all applicable items below are true:

- [ ] requested behaviour exists;
- [ ] relevant existing behaviour still works;
- [ ] lint passes;
- [ ] build passes;
- [ ] app loads without new browser errors;
- [ ] desktop screenshot inspected;
- [ ] laptop screenshot inspected;
- [ ] tablet screenshot inspected when responsive layout can be affected;
- [ ] mobile screenshot inspected when responsive layout can be affected;
- [ ] material visual diff understood;
- [ ] interaction flow tested;
- [ ] no unexplained horizontal overflow;
- [ ] no unexplained clipping/overlap;
- [ ] no missing/broken critical assets;
- [ ] visual artifacts/report retained for failures in CI;
- [ ] baseline updated only if the visual change was intentional.

For backend-only changes, apply the relevant subset and do not manufacture meaningless screenshots.

---

## 19. Agent continuation / handoff

Another coding agent must be able to continue after interruption.

Before ending an incomplete session, leave a concise handoff in the existing project tracking/handoff file if one is present. If the repository later adopts a dedicated progress file, keep it current.

A useful handoff states:

```text
Goal:
Current branch/commit:
What changed:
What currently works:
What still fails:
Exact failing command/test:
Failing viewport:
Relevant screenshot/diff artifact:
Suspected root cause:
Files touched:
Next action:
Do not regress:
```

Do not claim a failure is fixed if it has not been rerun after the final code change.

---

## 20. Communication standard

When reporting completed UI work, state evidence rather than confidence alone.

Good:

```text
Fixed the laptop canvas overflow caused by the workspace grid min-width.
Verified at 1920×1080, 1440×900, 1024×768 and 390×844.
Build and visual tests pass. No browser console errors.
```

Not sufficient:

```text
Should be fixed now.
```

When something cannot be verified, say exactly what remains unverified and why.

---

## 21. Important current files

Start investigation in these locations when relevant:

```text
components/garden-planner.tsx
components/blenheim-calendar-bridge.tsx
components/crop-rotation-bridge.tsx
components/garden-records-dialog-bridge.tsx
components/garden-media-dialog-bridge.tsx
app/growveg-workspace.css
app/planner-interactions.css
app/blenheim-calendar.css
app/crop-rotation.css
lib/garden/planner-plan.ts
lib/garden/layout-schema.ts
lib/garden/blenheim-calendar.ts
lib/garden/crop-rotation.ts
app/api/garden/route.ts
app/api/garden/records/route.ts
app/api/garden/media/route.ts
.github/workflows/build.yml
wrangler.jsonc
```

Always confirm the current tree because this list can evolve.

---

## 22. First visual-infrastructure task

Until this repository has a working browser visual test system, the next agent doing UI work should establish one rather than continuing to rely on compilation alone.

Minimum initial deliverable:

1. install/configure Playwright;
2. add Chromium browser tests;
3. add stable screenshot tests for the main planner;
4. capture desktop/laptop/tablet/mobile;
5. collect console/page errors;
6. detect unexpected horizontal overflow;
7. save layout diagnostics;
8. upload Playwright screenshots/diffs/report from GitHub Actions on failure;
9. document how to accept an intentional new baseline;
10. prove the workflow by running it against the current app.

After that foundation exists, all future visual changes should extend or reuse it.

---

## 23. Definition of success

The objective is not merely code that compiles.

The objective is a planner that:

- builds;
- runs;
- looks correct;
- behaves correctly;
- remains visually stable across realistic screen sizes;
- provides useful screenshot/diff evidence when it breaks;
- can be diagnosed and continued by the next agent without guessing.
