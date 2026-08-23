# Live WebGL design sync

The 2D planner and `/3d` WebGL view now share a browser-local live preview stream.

- Every in-memory `PlannerPlan` change is published to `blenheim-garden-live-plan`.
- The live preview stream does not write D1 and does not replace the normal Save workflow.
- `/3d` prefers the live planner plan when present, then falls back to D1/local saved data.
- A separate 3D companion window receives storage/custom-event updates while the 2D planner remains open.
- Beds, planting areas, rows, paths, trellises, trees, spacing and positions therefore come from the same planner state.

This is browser-local realtime mirroring. Persistence remains explicit through Save and the protected garden API.
