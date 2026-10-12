# Garden design tools

Open `/3d?view=3d` and choose **Design tools**.

## Direct editing

Drag a bed or structure in Select mode to move it. Empty-ground drags orbit the
camera. Selected footprints show eight yellow resize handles, red/blue move
arrows and a purple rotation ring. Corner handles change both dimensions;
edges change one. Numbered beds turn in 90° steps, retain stable IDs and rotate
their canonical plants. Structure rotation supports finer angles with 15° snap.
Container plants retain ownership during movement, resizing and rotation.
**Focus bed** enlarges the selection while retaining Top view. **Fit garden**
frames the complete garden after zooming or choosing Top.

Smart alignment snaps nearby edges/centres or the configured walkway gap.
Guides and clear-space measurements use plan directions. Rotated objects use
conservative bounds for clearance measurements. Collision checks apply to
creating, moving, resizing and rotating footprints, including paths. Covers
can contain beds. Existing legacy overlaps can be reduced; unrelated edits
and valid saved-layout restoration remain available. Invalid edits keep the
original plan and show the object causing the conflict. Copies seek clear space.

## Planting and selection

Preview dots and mature spacing circles use the same physical placement solver
as commit. Green fits, amber warns about close planting, and red identifies a
blocked position. The palette can lock the target soil to a chosen raised bed.
Fill/row/brush previews show spacing and plant counts before placement.

**Box select** selects footprint centres and whole crop groups with plant
centres inside the rectangle. Shift-click adds/removes selections. **Select
vegetables** preserves unselected fruit/herbs; **Select all plants** includes
every crop. Delete selection is one undo step. Occupied beds still require their
plants to be selected/removed before the container is deleted. Copies of planted
beds include their plants without copying selected child plantings twice.

## Access and shade

The Access section sets a preferred walkway width (30–200 cm). Amber guides
identify narrow gaps, blocked paths/entrance labels and reach concerns. The
reach starting points are 1.2 m across for access from both sides and 60 cm when
boundary access is restricted. Use the warnings to check your actual routes,
reach, equipment and mobility requirements. They are advisory; they do not
certify that a route is accessible. [RHS bed guidance](https://www.rhs.org.uk/soil-composts-mulches/no-dig-gardening).

The Sun section uses approximate Blenheim coordinates, the selected date/time
in Pacific/Auckland (including NZ daylight saving), and your true-north direction
clockwise from the plan top. Shadows use modelled fence, structure, bed and tree
heights. Add neighbouring obstructions as structures. The footprint overlay is
hidden below 5° sun elevation. Trees use an approximate canopy height. This is
a clear-sky layout preview, not a forecast. Calculations follow the
[NOAA fractional-year equations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF).
Pixel mode also supports access, spacing, comparison and shade overlays.

## Alternatives and saving

Layouts stores up to ten named snapshots **in this browser**, separately for
each garden. Saving the same name replaces that snapshot. Comparison shows
blue alternative footprints plus a dimensions/count table; it does not alter
the active plan. Restore is one Undo operation. Remove saved snapshot deletes
only the chosen browser snapshot. Regular protected Save persists the active
plan, north direction and walkway preference through the existing D1 garden
API and retains archived planting history. Snapshots contain no edit keys.

Orientation/walkway settings extend the existing editor_settings_json value;
there is no new migration. Snapshot validation and storage errors remain visible.
All production verification uses read-only API requests. Browser Save tests use
mock APIs and storage tests use isolated SQLite/D1 databases.
