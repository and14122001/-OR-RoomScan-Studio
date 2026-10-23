# OR RoomScan Studio — Browser Virtual Lab

This folder contains a standalone browser simulation companion for the Unity/Quest 3 project.

## Run

Open `index.html` in a modern browser. No dependencies, server, API key, login, or paid service is required. The page works offline after the file is available locally.

## Features

- Procedural room wireframe and grid, with draggable synthetic measurement points
- Editable room dimensions and volume calculation
- Simulated scan progress (not connected to a camera, depth sensor, or headset)
- Browser-local save/load using `localStorage`
- CSV point export, JSON session export, and validated JSON session import
- Parameterized 3D box models for embedded equipment, fixed cabinets, counters, and other fixtures; each record stores name, category, XYZ position, width/depth/height, notes, and ID\n- Fixture models are rendered in the room wireframe and included in JSON save/load/import/export records\n- Live 3D Euclidean distance between the first two synthetic measurement points
- Built-in checks for volume, unit conversion, 3D point distance, point bounds, session schema, and serialization
- Honest status panel linking to the Unity build instructions and status

## Limitations

This simulator does not access Quest 3 passthrough, Meta Scene API, spatial anchors, or real room meshes. It does not build or validate an Android APK. Measurement coordinates and fixture models are synthetic/manual parameterized geometry and must not be treated as a scan-derived as-built record or used for engineering or medical-gas CAD design. Record actual dimensions and positions only after measuring and checking them yourself. No pipe sizes, flow rates, pressures, or valve locations are inferred.

## Validation

Run the built-in `執行測試` panel in the browser. The repository also includes a dependency-free Node.js check: run `node tools/test_browser_simulator.mjs` from the repository root. The independent `Browser Simulator Tests` workflow runs this check on GitHub Actions. Passing these checks validates only browser-side logic; Unity compilation and physical Quest 3 tests remain separate acceptance gates.

## Publish a free hosted preview

1. In the GitHub repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** and save.
3. Open **Actions → Deploy Browser Virtual Lab** and re-run the latest workflow, or push a later change under `web/`.
4. The current deployment URL is https://and14122001.github.io/-OR-RoomScan-Studio/. The latest successful deploy is listed in GitHub Actions.

## CAD 2D-to-3D import (prototype)
- Import ASCII DXF files containing closed `LWPOLYLINE` outlines.
- Explicitly select source units (mm/cm/m/in/ft), extrusion height in meters, placement XYZ, and fixture category.
- Closed outlines are converted to parameterized 3D prism footprints. Original filename and DXF layer are stored with each model and preserved in session JSON.
- Current scope does not infer heights, close open contours, or reconstruct solids from text, blocks, arcs/circles, splines, or arbitrary LINE segments. Convert the intended equipment footprint to a closed polyline in CAD and verify scale/position after import.
- This is a browser prototype; it does not yet replace a full CAD/BIM kernel or Quest 3 scan-to-mesh pipeline.
