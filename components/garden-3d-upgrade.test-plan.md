# 3D upgrade visual verification

Before merging #44:

- Desktop 1920×1080: garden fills useful viewport; no oversized empty lawn.
- Laptop 1440×900: inspector remains readable and canvas does not clip.
- Tablet 1024×768: orbit/zoom/select work and plant artwork remains legible.
- Mobile 390×844: low-power representative caps hold; selection card does not obscure controls.
- Confirm uploaded plant PNGs resolve for representative tomato/bean/herb/flower crops.
- Confirm crops without PNGs still use low-poly fallback.
- Confirm repeated plants have subtle stable variation rather than visibly cloned orientation/scale.
- Confirm corn/tomato/climbing crops read taller; strawberry/lettuce lower; cucurbits wider.
- Confirm plant contact shadows do not z-fight with soil.
- Confirm soil is darker/more organic and timber boards are not perfectly identical.
- Confirm trellis netting is visible but not visually dominant.
- Confirm trees have branch structure in detailed mode.
- Confirm path dimensions, bed dimensions, planner coordinates and saved counts are unchanged.
- Confirm 2D → 3D live updates still mirror without refresh.
- Run `bun run lint` and `bun run build`.
- Check browser console/network/WebGL errors.
