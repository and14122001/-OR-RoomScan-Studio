# Multi-source Room and Equipment Modeling

## Goal

OR RoomScan Studio must support three complementary input sources in one project:

1. **Room scan** — Quest 3 spatial data, once the native integration is implemented and device-tested.
2. **CAD** — DXF/DWG-derived floor plans, ceiling plans, elevations, and equipment footprints.
3. **Photos** — user-provided equipment/room images for visual reference, material/color matching, and guided model construction.

These sources must be registered into one shared room coordinate system without silently inventing engineering dimensions.

## Uploaded reference drawing

The provided image shows a 4F cardiac catheterization room equipment layout with a floor plan, ceiling plan, and A/B/C/D elevations. It can guide the workflow and identify corresponding views, but it is a raster image, not source CAD. Dimensions read from the image are reference-only until confirmed from original DWG/DXF or approved dimension schedules.

### Important geometry note: sloped wall on elevations B and C

The user explicitly identified a **sloped/angled wall section visible in elevations B and C**. Treat this as required non-orthogonal wall geometry, not as a rectangular wall that can be approximated away.

Implementation requirements:
- Room boundaries must support arbitrary polygon vertices and wall segments with independent endpoints, not only a rectangular box.
- Represent the sloped wall using measured/confirmed plan endpoints and its height/profile from the relevant elevations or source CAD.
- Distinguish a wall whose plan footprint is angled from a wall whose vertical profile is sloped; these are different geometries.
- Do not infer angle, offset, height, or intersection from the raster screenshot. Obtain original DWG/DXF or confirmed dimensions/another view.
- CAD import and Quest 3 registration must preserve this non-orthogonal boundary; do not snap it automatically to 90-degree corners.
- Add validation cases for non-rectangular room polygons and sloped-wall geometry before claiming support.


## Proposed project workflow

1. Create a room project and set units / coordinate origin.
2. Import CAD files or raster drawing images as reference layers.
3. Assign each drawing view a type (plan, ceiling, elevation A/B/C/D, detail) and enter its known scale or at least one confirmed dimension.
4. Import equipment photos and associate each photo with an equipment record and view direction (front, left, right, rear, top, detail).
5. Build geometry from explicit dimensions and CAD outlines. Where a photo or single 2D view does not establish depth/height, prompt for a dimension or another view instead of guessing.
6. Register equipment to the room with editable XYZ position and rotation; keep source drawing coordinates and transformations.
7. Compare the assembled model with Quest 3 scan data when native scanning integration is available.
8. Save the project manifest, original sources, conversion settings, model geometry, registration transforms, and validation notes.

## Model provenance / confidence

Every object should retain:
- stable object ID, name, category, and revision;
- source file/image names and CAD layer/view association;
- dimensions and units, including whether each dimension is user-entered, CAD-derived, or estimated;
- transform (XYZ + rotation) and model-generation method;
- verification state: unverified, user-checked, or field-checked.

Never treat image pixel measurements as engineering-grade dimensions without a known scale and verification. Photo-based appearance matching is not proof of dimensional accuracy.

## Safety / engineering constraints

- Do not infer or modify medical-gas pipe sizes, flow rates, pressures, or valve locations.
- Do not label the model as ±1 mm accurate unless that tolerance is measured and validated against an appropriate reference.
- Keep original input files immutable; save transformations and derived models separately.
- Raster image import, CAD geometry import, photo texture/reference support, photogrammetry, and Quest spatial scanning are separate capabilities and must be tested independently.

## Current implementation status (2026-10-23)

- Browser lab: manual room and equipment box models, local save/load, JSON import/export.
- Room footprint prototype: editable XY polygon boundary (3–50 vertices) with area-based volume and non-rectangular wall rendering; boundary persists in session JSON and is validated on load/import. Wall tops are currently horizontal at one shared height. A wall with a sloped vertical profile is not yet modeled.
- CAD: ASCII DXF closed LWPOLYLINE footprint import, user-entered extrusion height, units, placement and planar rotation; multiple outlines preserve relative placement.
- Not yet implemented/verified: direct DWG parsing, automatic raster drawing vectorization, photo-based photogrammetry, image texture mapping onto generated equipment meshes, multi-view reconstruction, and Quest 3 on-device scanning/registration.
- Browser CI covers parser/math/source-level regression checks; it does not replace visual browser QA, Unity compilation, or Quest 3 hardware validation.


## 2D PDF import milestone (2026-10-24)

The browser lab now includes a PDF page workflow using PDF.js:
- Import standard or scanned PDF, choose page, render page preview.
- Calibrate scale by clicking two endpoints of a known dimension and entering its actual length in metres.
- Manually trace a closed footprint with up to 50 vertices, inspect numbered corners, undo points, and extrude using a user-entered height.
- Create a 3D prism record with PDF filename/page provenance, explicit placement, category, and height; normal project JSON persistence applies.
- Supports both vector-origin PDFs and raster/scanned PDFs at the rendered-page level; it does **not** automatically recover CAD vectors, recognize dimension annotations, infer equipment depth/height, or semantically reconstruct a full drawing.
- PDF.js is loaded from cdnjs, so first use requires network access. The original PDF remains user-controlled in browser memory; the generated model contains traced geometry/provenance, not the embedded PDF bytes.
- All scale calibration and traced geometry require user verification against approved dimensions. Do not use screenshot-derived estimates as engineering dimensions.
