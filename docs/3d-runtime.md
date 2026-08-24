# 3D runtime

The production app includes a `/3d` route backed by `components/garden-webgl.tsx`.

The WebGL renderer uses a persistent Three.js renderer/camera and a `ResizeObserver` so the canvas and camera projection follow the actual browser viewport without recreating the renderer.

Mobile behaviour:

- the 3D viewport remains the primary surface;
- the inspector stacks below the viewport on narrow screens;
- controls reflow for phone portrait and landscape;
- renderer size and camera aspect update when the browser is resized or the phone rotates;
- named-garden selection remains shared with the 2D planner.

This file also serves as a deployment marker for the restored responsive 3D route.
