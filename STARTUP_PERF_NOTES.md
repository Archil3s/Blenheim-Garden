# WebGL startup performance

The `/3d` route lazy-loads the Three.js client renderer behind a lightweight immediate loading shell. The first WebGL scene prioritizes time-to-first-frame: dense planting areas and rows are sampled to a maximum of 96 rendered plants while logical counts remain unchanged, renderer pixel ratio starts at 1, antialiasing is disabled, and the shadow map uses a cheaper 512px PCF map. This affects presentation only; saved planner spacing/count data is unchanged.
