# Garden studio workflows

Open `/3d?view=3d` for detailed models, or choose Pixel garden. The shared plan,
centimetre geometry, protected Save and Undo/Redo remain the source of truth.

## Plant the selected soil

Select a bed/container through the canvas or Objects, then choose **Plant here**.
The compact card names that soil and lets you choose crop, variety and spacing.
Single, Paint, Row and Patch retain that target. Hide controls exposes the soil
while keeping the planting tool active. **Preview fill bed** shows the
available plant count and candidate positions without changing the saved plan.
Apply creates one Undo step; Cancel leaves existing plants alone. Planting tools
freeze camera gestures so dragging paints plants instead of orbiting the scene.

## Keep plants attached

Bed/container moves and rotations carry their plantings, including legacy rows
whose owner can be inferred from the soil. Group selection does not move owned
rows twice. Resizing preserves canonical IDs and counts. Enable **Rearrange
plants when resizing** to distribute plants using their recorded spacing rather
than scaled positions; this applies to dimensions and canvas resize handles.
Insufficient space rejects the resize instead of dropping plants. **Preview
plant arrangement** is an independent preview with Apply, Cancel and Undo.

## Context controls and camera

Selecting soil reveals the relevant actions. Planting uses its compact card;
clearance details and size-only templates are collapsed in the inspector.
Double-click an object to select and focus it. The Camera menu provides **Lock
camera**, **Focus selection** and **Whole garden**. Top/Perspective and Fit garden
remain available. Camera lock blocks gesture movement; explicit focus/fit still
works. The main 2D planner continues to mirror committed edits.

## Connected paths

Add path supports Straight and Right angle. With snap enabled, endpoints within
25 cm join an existing endpoint or centreline. Right-angle routing tries both
elbows and rejects routes that collide with beds/structures. The preview shows
the segments that will actually be placed. **Continue connected path** starts
the next segment at the last endpoint; Escape finishes the chain. Each committed
segment/route is independently undoable. Paths retain their centimetre width.

## Timeline

Garden studio → Timeline previews one soil surface or the whole garden at
sowing, maturity and harvest. Enter assumed planting date and timing from your
seed packet, then scrub the date or use the stage buttons. Growth changes visual
scale and detailed-3D appearance: seedlings use young leaves, then foliage,
flowers and fruit appear in stages. Pixel mode changes sprite scale. Before
planting and after harvest the selected crops disappear from the
view. **Back to editing** restores the actual plants. This does not modify saved
counts, milestone records or D1 history. Default 60/90-day timings are visual
estimates, not crop-specific harvest predictions.

## Planted templates

Garden studio → Templates captures the selected bed/container's dimensions,
crops, varieties, spacing, placements/counts and growing conditions. A template
is a snapshot, so later source-bed changes do not change it. **Place template**
creates a movable ghost, then click/tap clear space to commit it with new object
and plant IDs. Placement selects the copy and is one Undo step. Templates stay
in this browser, separately per named garden, with a maximum of 30 entries. Save
persists a placed bed through the normal garden API; it does not sync the template
library. Existing size-only bed templates remain available separately.

## Layout assistant

Garden studio → Layout assistant accepts requested crops, planting month,
priority and optional new-bed dimensions/count. Existing measured beds and
structures stay fixed. The default preserves plants; replacing unlocked beds'
plants requires the explicit checkbox. Locked beds and their contents stay fixed.

Compare Balanced beds/Best fit with Reach from edges using their plant counts
and actual garden previews. The solver uses catalogue spacing, seasonal starter
choices, recorded sun/soil inputs and preferred access gaps. The edge alternative
leaves a central planting gap. Blank gardens also receive connected access paths
when new beds are requested. If the request does not fit, it fails visibly.
Preview never publishes the proposal. Apply validates against the current plan
and creates one Undo step; Save persists it. These are layout candidates to
review against your actual site and growing conditions, not guaranteed yields.

## Validation and persistence

No dependencies, artwork or schema migrations are added. Protected writes,
private R2 bindings and archived-bed history remain unchanged. Real-browser
workflow tests use mocked APIs; production audits permit GET only. Canonical
plant counts, ownership, cancellation, stale drafts, Undo and named-garden
storage are checked independently of screenshots.
