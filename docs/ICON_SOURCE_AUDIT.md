# Verified source artwork policy (2026-11-09)

This is a report for the isolated /test-garden icon-audit page. No changes to the main /planner icon resolver are authorised or made here.

## Rasmussen
User-supplied HTML: Rasmussen_Chilli_137_Icon_Gallery(2).html.
It lists 137 chili varieties but only 10 embedded original PNGs; remaining 127 are explicitly pending.

Those ten PNGs were decoded from the HTML and their Git blob hashes compared byte-for-byte with the pre-existing repo assets in public/assets/icons/rasmussen/approved. **All ten matched exactly.** The test garden uses only these ten source originals; unreviewed Rasmussen concept batches are excluded.

## Kings Seeds
User-supplied PDF: kings-seeds-uploaded-icons.pdf. It has 400 separate PDF embedded pictures, but they are already cropped picture extracts from comparison sheets. Several have a fragment of a neighbour or text cut through the image; 41 catalogue entries are listed as missing. These PDF pieces are not verified individual original icons.

Older assets in public/plant-icons/individual and public/plant-icons/kings-seeds-art differ from the exact artwork in the submitted PDF; they must not be silently substituted. All 441 Kings Seeds varieties remain marked Artwork pending until complete original individual images are available and verified by exact variety ID.

## Rules
- Every displayed icon must be the complete original, independently verified and matched to its named variety.
- No clipped contact-sheet extracts, generic substitutes, screenshots or unreviewed recolours can fill gaps.
- If an image fails to load, show Image unavailable, never a different picture.
- Keep production planner, D1 database, saved bed coordinates and R2 media unchanged.
- To add a new icon, supply its uncropped original file, verify variety/ID/provenance, and add it to the source mapping with a stable path and hash.
