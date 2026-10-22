# Implementation backlog

## P0 — working Quest build
1. Pin compatible Unity, Meta XR SDK, MRUK and QuestRoomScan versions.
2. Confirm scan start/stop/save/reload with QuestRoomScan.
3. Implement and compile-test an adapter against the pinned package API.
4. Validate Meta Depth API occlusion in a separate test scene.
5. Add room-virtualization UI and passthrough fallback.

## P0 — CAD trust and safety
6. Implement DXF import with explicit units and layer preservation.
7. Implement CAD-to-scan registration using measured control points.
8. Display registration residuals and deviation heatmap.
9. Keep medical-gas design layers read-only; never infer engineering values.

## P1 — QA and exports
10. Implement PLY/OBJ/GLB exporters with round-trip tests.
11. Implement DXF/PDF report generation and verify DWG conversion in desktop CAD.
12. Add repeat-scan comparison and CSV precision report.
13. Profile thermal/memory/FPS while scanning, occluding and rendering CAD.

## P2 — refinement
14. Optional object detection for labeling only, not measured boundaries.
15. Optional Gaussian Splat visualization; mesh remains engineering geometry.
16. Multi-room project management.
