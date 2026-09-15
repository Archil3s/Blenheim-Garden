# Safety constraints

The visual upgrade must not change:

- garden dimensions or bed geometry;
- stored plant counts or spacing;
- D1 persistence;
- named-garden routing;
- the 2D planner as source of truth;
- the existing uploaded plant artwork resolver;
- live planner event semantics.

Visual jitter is render-only, deterministic, and limited to a few centimetres. Representative plant caps affect only rendering, never saved counts.
