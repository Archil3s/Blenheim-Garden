# Final integration step

Wire the feature modules into the existing `components/garden-webgl-visual.tsx`. This is deliberately left as one reviewable renderer change because that file owns WebGL lifecycle, disposal, live-plan rebuilds and raycasting; splitting lifecycle edits across partial commits would make regressions harder to review.
