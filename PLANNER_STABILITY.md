# Planner stability hotfix

The 2D planner is kept independent from WebGL. Dense planting visuals are sampled so saved gardens with very tight spacing cannot lock the browser. The /3d route is temporarily disabled while the renderer is rebuilt separately.
