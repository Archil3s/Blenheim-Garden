# Rasmussen Gardens — individual botanical icons

This folder is the source workflow for **285 Rasmussen Gardens entries**, including six seed collections. The uploaded prompt pack provides cultivar links, image-generation instructions, and unique target filenames. **It contains prompts, not finished icons.**

## Source and files
- `rasmussen-gpt-images-prompt-pack.md`: original uploaded master prompt and all 285 individually numbered cultivar prompts.
- `manifest.json`: machine-readable list of variety names, product URLs, suggested filenames and asset status.
- `icons/`: future standalone icons. **No individual Rasmussen PNGs have been generated/uploaded yet.**

## Instructions for Codex
1. Read the master prompt and target variety's instructions in `rasmussen-gpt-images-prompt-pack.md`.
2. Find and verify a photo of that exact named cultivar via the listed product URL (the URLs alone are *not* verified photos).
3. Use the isolated approved planner illustrations strictly as **style references**. Do not use a comparison sheet screenshot as an icon.
4. Create one **independently generated** botanical illustration per variety. Preserve varietal shape, size, colour, fruit or pod markings and botanical details.
5. Deliver a square transparent PNG, ideally 512×512 master with 128×128 export, clean silhouette with 8–10% padding, no text/pot/soil/background/shadow. Inspect at 32px.
6. Save to `icons/<suggestedFilename>` and update that item's status in the manifest only after the file exists and passes QA.
7. Keep these new icons separate from the live `public/plant-icons/rasmussen/*.svg` files until approved. Never overwrite existing assets or use generic auto-generated substitutes.

The separate [Kings Seeds concept library](../kings-seeds-botanical-concepts) follows the same review-first structure.
