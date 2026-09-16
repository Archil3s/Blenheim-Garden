# 3D crop morphology

The live 3D garden renderer uses `components/garden-plant-3d.ts` for crop-specific procedural plant geometry.

## Design goals

- Distinguish crops by morphology rather than colour alone.
- Keep deterministic per-plant variation so repeated plants do not look cloned.
- Use separate stem, branch, leaf, fruit, flower, pod, bulb, head and vine forms where appropriate.
- Preserve a reduced-detail mobile path.
- Keep the renderer self-contained in Three.js without external model downloads.

## Supported morphology families

Tomatoes; strawberries; blueberries; raspberries; pumpkins; zucchini/courgettes; cucumbers; melons; lettuce; spinach; silverbeet/chard; broccoli; cauliflower; cabbage; kale; bush beans; climbing/runner beans; peas; broad/fava beans; carrots; beetroot; radish/daikon/turnip; onions; garlic; leeks; corn/maize; capsicum/chillies; basil; rosemary; parsley/coriander; dill/fennel; and a generic leafy/herb fallback.

## Open-source design references

The implementation is original. Its procedural design approach is informed by open-source Three.js vegetation projects that model species through morphology and parameter variation rather than reusing a single foliage primitive:

- SeedThree — species presets, morphology, branch angles, fruit placement, deterministic procedural variation.
- VegetationGeneratorThreeJS — separate stem/branch/leaf density and seeded procedural growth controls.
- procedural-plants-threejs — procedural geometry built directly in Three.js.

No source artwork or geometry was copied into this project.
