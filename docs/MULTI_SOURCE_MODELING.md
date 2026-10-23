# Multi-source Room and Equipment Modeling

## Goal

OR RoomScan Studio must support three complementary input sources in one project:

1. **Room scan** — Quest 3 spatial data, once the native integration is implemented and device-tested.
2. **CAD** — DXF/DWG-derived floor plans, ceiling plans, elevations, and equipment footprints.
3. **Photos** — user-provided equipment/room images for visual reference, material/color matching, and guided model construction.

These sources must be registered into one shared room coordinate system without silently inventing engineering dimensions.

## Uploaded reference drawing

The provided image shows a 4F cardiac catheterization room equipment layout with a floor plan, ceiling plan, and A/B/C/D elevations. It can guide the workflow and identify corresponding views, but it is a raster image, not source CAD. Dimensions read from the image are reference-only until confirmed from original DWG/DXF or approved dimension schedules.

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
- CAD: ASCII DXF closed LWPOLYLINE footprint import, user-entered extrusion height, units, placement and planar rotation; multiple outlines preserve relative placement.
- Not yet implemented/verified: direct DWG parsing, automatic raster drawing vectorization, photo-based photogrammetry, image texture mapping onto generated equipment meshes, multi-view reconstruction, and Quest 3 on-device scanning/registration.
- Browser CI covers parser/math/source-level regression checks; it does not replace visual browser QA, Unity compilation, or Quest 3 hardware validation.
