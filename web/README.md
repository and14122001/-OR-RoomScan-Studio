# OR RoomScan Studio — Browser Virtual Lab

This folder contains a standalone browser simulation companion for the Unity/Quest 3 project.

## Run

Open `index.html` in a modern browser. No dependencies, server, API key, login, or paid service is required. The page works offline after the file is available locally.

## Features

- Procedural room wireframe and grid, with draggable synthetic measurement points
- Editable room dimensions and volume calculation
- Simulated scan progress (not connected to a camera, depth sensor, or headset)
- Browser-local save/load using `localStorage`
- CSV point export and JSON session export
- Built-in checks for volume, unit conversion, point bounds, session schema, and serialization
- Honest status panel linking to the Unity build instructions and status

## Limitations

This simulator does not access Quest 3 passthrough, Meta Scene API, spatial anchors, or real room meshes. It does not build or validate an Android APK. Measurement coordinates are synthetic and must not be used for engineering or medical-gas CAD design. No pipe sizes, flow rates, pressures, or valve locations are inferred.

## Validation

Run the built-in `執行測試` panel in the browser. Passing these checks validates only browser-side logic; Unity compilation and physical Quest 3 tests remain separate acceptance gates.
