# OR RoomScan Studio

Meta Quest 3 mixed-reality room scanning and CAD comparison toolkit, initially targeting operating-room documentation and visualization.

## Project goals
- Capture and reconstruct room geometry on Quest 3.
- Virtualize the scanned room while retaining a safe passthrough reference.
- Prototype dynamic occlusion using Meta's Environment Depth / Depth API.
- Align existing CAD drawings with scan geometry and visualize deviations.
- Produce traceable measurement reports and interoperable exports.

## Important limitations
- **This repository is an early scaffold, not a finished Unity app or APK.**
- Quest 3-only ±1 mm measurement accuracy is an unverified target, not a claim.
- Scene API geometry and depth occlusion are not survey-grade measurement systems.
- Do not use a virtualized scene as a walking-safety system.
- Medical gas pipe sizes, flow rates, pressures and valve locations must never be inferred or changed automatically. Use approved drawings and specifications.

## Architecture
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/INTEGRATION_MAP.md](docs/INTEGRATION_MAP.md), and [docs/ACCEPTANCE_TESTS.md](docs/ACCEPTANCE_TESTS.md).

## Upstream projects
- [QuestRoomScan](https://github.com/genesisinteractive/QuestRoomScan)
- [Meta Project Phanto](https://developers.meta.com/vr/documentation/unity/unity-sample-phanto/)
- [Meta Depth API sample](https://developers.meta.com/vr/documentation/unity/unity-sample-depth-api/)
- [Meta Scene API](https://developers.meta.com/vr/design/mr-health-scene/)

## Current status
Early Unity project baseline committed: QuestRoomScan is pinned to `v1.3.2`, a runtime controller calls its documented scan/save/load facade, and a manual Android APK workflow is present. This is **not yet a verified APK**: Meta XR/OpenXR setup, the RoomScan Game-Ready scene wizard, Unity package resolution, Android compilation, and Quest 3 device tests remain unverified. CAD import/registration, deviation heatmap, DXF/PDF export, and measurement validation also remain to be implemented. See [docs/BUILD_STATUS.md](docs/BUILD_STATUS.md) for the exact blockers and handoff checklist.

## License
No project license has been selected yet. Do not assume this repository is open for reuse until a license is added. Third-party dependencies retain their own licenses.
