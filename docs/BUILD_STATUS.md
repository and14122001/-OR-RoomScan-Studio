# Build Status — 2026-10-25

## Verified in GitHub
- Unity project folder and package manifest are committed.
- QuestRoomScan is pinned to `v1.3.2`; the package's own manifest declares Unity `6000.2`, AR Foundation `6.1.1`, URP `17.0.3`, Burst `1.8.18`, Collections `2.4.3`, Mathematics `1.3.2`, and Meta MR Utility Kit `205.0.0`.
- A minimal runtime controller calls the documented `RoomScanSession` API for scan start, finalize/save, and load-latest.
- A headset HUD/controller script exposes scan start, finalize/save, and load-latest.
- An Editor menu command attaches the runtime controller to the Game-Ready scene.
- A guarded Android ARM64 build entry point validates the configured scene set, checks the required Android xatlas native plugin, sets the app ID, and builds the APK.
- A repeatable ADB helper installs and launches the APK on an authorized Quest/Android device.
- A manual GitHub Actions workflow runs repository preflight, then attempts the licensed Unity build and uploads the APK artifact.

## Latest CI results (2026-10-25)
- Browser simulator validation workflow passed after adding local-session schema, dimension, and point-boundary checks: [run history](https://github.com/and14122001/-OR-RoomScan-Studio/actions).
- GitHub Pages is enabled and deployment succeeded. Browser simulator is hosted at https://and14122001.github.io/-OR-RoomScan-Studio/.
- DXF import preserves relative X/Y placement of multiple closed polylines in one file instead of stacking every footprint at the same insertion point; regression tests check two outlines and the 1.5 m source offset.
- DXF import now also supports an explicit whole-drawing planar rotation (−360° to +360°) before placement/extrusion; tests check a 90° rotation swaps a 1.0 × 0.6 m footprint to 0.6 × 1.0 m and rejects out-of-range angles. Browser test and Pages deployment workflows passed for the latest app/test revision.
- The manual Quest 3 APK workflow passed repository preflight but stopped at its explicit Unity licensing-secret check. No Unity compilation occurred and no APK artifact was produced. Configure `UNITY_LICENSE`, or `UNITY_EMAIL` + `UNITY_PASSWORD`; if Meta package resolution requires it, also configure `META_UPM_TOKEN`.

## Not yet verified
- Unity Package Manager resolution in an actual Unity 6.2 Editor.
- Meta XR Core / Meta OpenXR package installation and project setup.
- QuestRoomScan **RoomScan > Setup Scene > Apply Game-Ready Setup** completed in the Editor.
- A configured scene added to Android Build Settings and the OR runtime controller attached.
- Android APK compilation, APK installation, launch, passthrough, scanning, persistence, and controller inputs on Quest 3.
- Any metrology accuracy claim.

## What blocks a real APK right now
This repo cannot truthfully be called installable until the Unity Editor completes Meta-specific project setup and an Android build succeeds. The GitHub Actions workflow needs Unity licensing secrets (`UNITY_LICENSE`, or `UNITY_EMAIL` and `UNITY_PASSWORD`). If Meta's UPM registry requires authentication for this account, also configure `META_UPM_TOKEN`. Once the scene and project settings have been generated and committed from Unity Editor, run **Actions → Build Quest 3 APK → Run workflow** and inspect the build log/artifact.

## Minimum local handoff needed
1. Install Unity 6.2+ with Android Build Support, Android SDK & NDK Tools, and OpenJDK.
2. Open the `Unity/` folder and let packages resolve; resolve any package-manager errors without silently changing the QuestRoomScan pin.
3. Let Package Manager resolve the pinned Meta XR Core/OpenXR dependencies. If the registry denies access, sign in/accept the SDK license in Unity and configure the required Meta package authentication; do not blindly upgrade package versions.
4. Run QuestRoomScan's Game-Ready Setup wizard, then use **OR RoomScan > Prepare Scene For APK**. Save/commit the generated scene and project settings into this repo; the preparation menu adds the scene to Build Settings.
5. In the RoomScan setup wizard's **NATIVE PLUGINS** section, build xatlas if Android `libxatlas.so` is missing; wait for the build to finish.
6. Build Android ARM64 APK locally or configure the GitHub Actions license secrets and run **Actions → Build Quest 3 APK → Run workflow**.
7. Install on Quest 3 and capture evidence (build log, app launch, passthrough, scan/save/load test).

## Safety / precision
The app is a visualization and room-reconstruction prototype, not a certified survey instrument or medical device. Quest 3 depth reconstruction must be validated against independently measured reference dimensions. Do not claim ±1 mm unless documented validation results support it. Medical-gas drawing data must remain tied to approved source drawings/specifications; never infer pipe sizes, flows, pressures, or valve locations.

## Room fixtures and cabinet modeling update
- Added a browser-side fixture library for manually specified embedded equipment, fixed cabinets, counters, and other fixed objects.
- Each object record stores a stable local ID, name, category, XYZ origin, width/depth/height, and notes. The objects are rendered as colored 3D box outlines in the room view and included in local save/load plus JSON export/import.
- Bounds validation rejects objects outside the room or with invalid dimensions. This is parameterized/manual modeling, not automatic scan reconstruction; actual Quest 3 sensing, mesh extraction, occlusion, and metrology remain unverified.
- Change commits: `506ea7e90fd9f38cab90503eff1d6ad2767a31cd` (feature), `321a08d63ec4da7dbf03f548487f4446190f488f` (JavaScript fix). Browser simulator tests passed in [run 39902182465](https://github.com/and14122001/-OR-RoomScan-Studio/actions/runs/39902182465); Pages deployment succeeded in [run 39902182483](https://github.com/and14122001/-OR-RoomScan-Studio/actions/runs/39902182483).

## CAD import milestone (2026-10-23)
- Added ASCII DXF import for closed `LWPOLYLINE` outlines; explicit unit conversion, extrusion height, XYZ placement, fixture category, and source layer/file metadata.
- Imported footprints render as extruded 3D prisms and persist with session JSON/local save. Parser rejects missing/invalid closed outlines and applies size/boundary checks.
- Regression tests now exercise a 1000 × 600 mm closed cabinet footprint converting to 1.0 × 0.6 m, preserving the layer, and rejecting a file with no closed outline.
- Implementation commits: `be35f56887ee0c8054290e7682f130c83778dce7` and parser fix `6370109eb5cd57ad493a01ba5adfb54f3de0b4f5`. Regression tests were fixed and passed in [run 39902550352](https://github.com/and14122001/-OR-RoomScan-Studio/actions/runs/39902550352). Pages redeployment succeeded in [run 39902550370](https://github.com/and14122001/-OR-RoomScan-Studio/actions/runs/39902550370).


## Multi-source modeling requirements (2026-10-23)

- Added `docs/MULTI_SOURCE_MODELING.md` defining the unified workflow for Quest room scans, CAD floor/ceiling/elevation drawings, and equipment photos, including source provenance, coordinate registration, dimension verification, and medical-gas design constraints.
- User-provided 4F cardiac catheterization room reference image reviewed: it contains a floor plan, ceiling plan, and A/B/C/D elevations. Treat as a raster reference only; use original CAD and verified dimensions for engineering geometry.
- This commit documents the next development scope; it does not claim photo reconstruction, raster vectorization, or Quest 3 native scanning are already implemented.


## 2D PDF modeling support (2026-10-24)

- Added browser PDF import using PDF.js: select PDF/page, calibrate scale from a known dimension, manually trace up to 50 closed-footprint vertices, undo/close outline, set extrusion height and XYZ placement, and create a 3D prism with PDF filename/page provenance.
- Supports vector and scanned/raster PDFs as rendered pages. It does not automatically vectorize the drawing, recognize dimensions, infer depth/height, or perform semantic 3D reconstruction. PDF.js currently loads from a CDN, so first use requires internet access.
- Automated browser test workflow passed for the implementation and regression commits. Latest Pages deployment succeeded in [Deploy Browser Virtual Lab #65](https://github.com/and14122001/-OR-RoomScan-Studio/actions/runs/40047452151) on commit `0739569648d39cda243611e0203bfb3db2cdbebd`.
- Engineering dimensions must be calibrated against confirmed drawing dimensions. No medical gas sizes, flow, pressures, or valve positions are inferred.


## PDF calibration, contour validation, and multi-view records (2026-10-24)

- Added raster-based candidate detection for long horizontal/vertical lines and a selectable detected baseline; scale is computed from candidate pixel length and a user-confirmed real-world length. Detection may include dimensions, text, or unrelated edges and is not semantic CAD recognition.
- Added cross-checking of multiple baseline measurements on the current PDF page. If the new estimate differs from prior estimates by more than 2%, it is rejected; consistent estimates are averaged. These checks reduce calibration-entry errors but do not establish survey-grade accuracy.
- Added optional local-contrast edge snapping while manually tracing a PDF footprint. Snapping is heuristic and must be visually verified.
- Added polygon area/perimeter reporting and rejection of self-intersecting or degenerate outlines.
- Added plan/elevation/section view-type records containing filename, page, scale, baseline-check count, and detected-line count. These records are reference metadata only: feature correspondence, cross-view registration, and automatic 3D fusion are not implemented.
- Browser regression tests passed in [run 40047452127](https://github.com/and14122001/-OR-RoomScan-Studio/actions/runs/40047452127); Pages deployment succeeded in [run 40047452151](https://github.com/and14122001/-OR-RoomScan-Studio/actions/runs/40047452151).
- Remaining geometry gap: vertical profiles of slanted walls, automatic wall/door/window/equipment classification, plan/elevation feature matching, and uncertainty/conflict reporting still require implementation.


## Browser test and source separation milestone (2026-10-25)

- Added Playwright Chromium smoke tests covering page load, room-dimension update, fixture creation, the built-in test panel, and uncaught page errors. GitHub Actions run [40174588913](https://github.com/and14122001/-OR-RoomScan-Studio/actions/runs/40174588913) passed.
- Split the browser simulator's inline styling and application logic into `web/styles.css` and `web/app.js`; `web/index.html` now loads those assets separately. Existing Node regression checks were updated to parse the external application script.
- The current source split and regression suite are being validated by the latest CI run; do not consider the split fully accepted until the post-split CI run passes.
