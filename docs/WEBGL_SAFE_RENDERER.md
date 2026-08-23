# WebGL safe renderer

The `/3d` route uses `components/garden-webgl-lite.tsx` as a low-cost fallback renderer.

It keeps the measured garden geometry while reducing GPU pressure with instanced plant meshes, hard plant sampling caps, disabled shadow maps, disabled antialiasing and a capped device pixel ratio.

This file exists to force a pull-request build against the exact production renderer tree after the 23 August 2026 stability fix.
