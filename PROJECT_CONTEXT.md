# Blenheim Garden — Project Context

_Last updated: 20 August 2026_

This file is the handoff/reference document for future ChatGPT/Codex sessions working on this repository.

**Repository:** `Archil3s/Blenheim-Garden`

**Production branch:** `main`

---

## 1. Product goal

Blenheim Garden should be a simple, low-friction garden planner for a home vegetable garden in Blenheim, Marlborough.

The product should make it easy to answer:

1. What needs doing today or this week?
2. What is planted in each bed?
3. What seedlings are being raised?
4. What can be sown or transplanted now in Blenheim?
5. What has been harvested and roughly how much?

Avoid turning it into a commercial farm-management system. The UI should stay visual, mobile-friendly and easy to scan.

---

## 2. Initial garden model

The initial dashboard is built around 12 garden beds.

Planned data areas:

- beds
- crops and varieties
- seed sowing dates
- germination / seedling status
- transplant dates
- seasonal planting windows
- garden tasks
- harvest dates and yields
- notes

No database has been added yet. The first version is intentionally a static UI shell so the data model can be designed before persistence is introduced.

---

## 3. Current stack

- Next.js `16.2.11`
- React `19.2.x`
- TypeScript `5.9.x`
- OpenNext Cloudflare `1.20.2`
- Wrangler `4.124.0`
- Cloudflare Workers target

---

## 4. Cloudflare deployment

Known intended production configuration:

```text
Build command:
npx @opennextjs/cloudflare build

Deploy command:
npx @opennextjs/cloudflare deploy

Production branch:
main
```

The package script must remain:

```json
"build": "next build"
```

Do not make `npm run build` invoke OpenNext when Cloudflare already runs the OpenNext build command.

`wrangler.jsonc` uses:

```text
name: blenheim-garden
main: .open-next/worker.js
assets: .open-next/assets
compatibility_flags: nodejs_compat
```

`next.config.ts` keeps:

```ts
output: "standalone"
```

---

## 5. Current UI

The initial homepage contains:

- Blenheim Garden hero
- spring setup/current-focus card
- today/task area
- quick cards for seedlings, planting calendar, crops and harvests
- a visual 12-bed garden grid
- responsive mobile layout

Most controls are placeholders at this stage. Do not assume buttons are wired to persistent data yet.

---

## 6. Development principles

1. Keep the UI simple and visual.
2. Prefer a few obvious actions over large menus.
3. Make mobile usability a first-class requirement.
4. Use Blenheim-specific seasonal timing when adding planting guidance.
5. Keep horticultural guidance separate from user-entered garden state.
6. Add persistence only when the data model is clear.
7. Prefer small isolated changes.
8. Preserve the working Cloudflare/OpenNext configuration.
9. Update this file after major architecture, deployment or UX changes.

---

## 7. Recommended next build order

1. Make the 12 beds editable.
2. Define crop/variety and planting records.
3. Add seedling tracking.
4. Add a Blenheim sow/transplant calendar.
5. Create the Today / This Week task engine.
6. Add harvest logging.
7. Decide whether local browser storage is sufficient or whether durable Cloudflare storage is needed.

---

## 8. New-chat bootstrap prompt

```text
Work on my GitHub repo Archil3s/Blenheim-Garden.
First read PROJECT_CONTEXT.md and inspect the current code before making changes.
Keep the existing Cloudflare/OpenNext deployment working and keep the garden UI simple, visual and mobile-friendly.
```
