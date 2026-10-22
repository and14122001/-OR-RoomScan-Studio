# Acceptance tests — real Quest 3 required

## Runtime
- [ ] Android build installs and launches on the target headset.
- [ ] Scene/depth/camera permission denial is handled clearly.
- [ ] 30-minute scan completes without crash or corrupted scan package.
- [ ] FPS, peak memory, thermal throttling and battery drain are recorded.

## Scan and precision
- [ ] Capture walls, floor, ceiling, doorways and representative furniture from multiple viewpoints.
- [ ] Record coverage gaps, holes and low-confidence regions.
- [ ] Repeat the same scan at least three times.
- [ ] For any ±1 mm claim, collect at least 10 independent known-length checks across orientations.
- [ ] Record reference instrument and its uncertainty.
- [ ] Keep calibration points separate from held-out validation points.
- [ ] Calculate maximum absolute error, MAE, RMSE and repeat-scan spread. If tolerance fails, label results approximate/visualization-only.

## CAD registration
- [ ] Verify source drawing units, origin and axis convention.
- [ ] Use at least three non-collinear control points plus independent check points.
- [ ] Save transform matrix, control-point IDs and residual report.
- [ ] Show overlay residuals and mismatch heatmap.
- [ ] Original CAD and design layers remain unchanged.
- [ ] Never infer or alter medical gas pipe sizes, flow, pressure or valve locations.

## Virtualization and occlusion
- [ ] Toggle passthrough reference, scan mesh and virtual shell independently.
- [ ] Test people moving in front of and behind virtual cabinets.
- [ ] Test hands, thin objects, reflective surfaces and low light.
- [ ] Test depth bias and wall-edge artifacts; preserve a passthrough fallback.
- [ ] Never instruct users to walk based only on the virtualized room shell.

## Exports
- [ ] PLY/OBJ/GLB reopen in independent viewers with scale and axes checked.
- [ ] DXF reopens in CAD with units and layers verified.
- [ ] PDF report includes date, device/build, reference method, uncertainty and limitations.
- [ ] DWG is validated through an actual desktop CAD open/save workflow.
