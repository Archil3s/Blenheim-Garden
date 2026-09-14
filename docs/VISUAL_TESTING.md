# Browser verification

Build the application, then run the browser suite:

```sh
bun install
bun run build
bunx playwright install chromium
bun run visual:test
```

On Windows with Edge installed, set `PLAYWRIGHT_CHANNEL=msedge`. To inspect a
running server, set `VISUAL_BASE_URL`; the default is `http://127.0.0.1:3000`.
The suite starts `bun run start` when no local server is running.

The four projects cover 1920×1080, 1440×900, 1024×768, and 390×844. The phone
project emulates touch and mobile Chromium. This does not replace testing on
physical iOS/Safari devices.

All API traffic is intercepted with deterministic synthetic garden data. Tests
never write production D1 or R2. Fixtures preserve the measured 12-bed layout
and include 70 King Purple beans. The suite checks:

- Visible beds, exact saved quantities, adaptive crop detail, and canvas bounds.
- Inspector groups and restrained destructive actions.
- Today, Notes, Photos, Rotation, Settings, and all drawing tools.
- Move, Undo, Redo, snap, and named-garden isolation.
- Unsaved, local-only, saving, failure, and saved feedback.
- Standalone 3D rendering and navigation back to the plan.
- Browser errors and horizontal page overflow.

Screenshots and layout diagnostics are written to `visual-artifacts/current/`;
HTML results are in `playwright-report/`. Both are ignored by Git and uploaded
by the separate Visual browser checks workflow. Run `bun run visual:report`
to inspect results.

Screenshots are review evidence, accompanied by geometry and interaction
assertions. This initial suite deliberately does not bless the old production
layout as a pixel baseline. To introduce pixel comparisons, capture baselines
in the same browser/OS as CI, inspect all four viewports and interactions, then
add `toHaveScreenshot` assertions. Only update a baseline after reviewing an
intentional design change; never update one simply to make CI pass.
