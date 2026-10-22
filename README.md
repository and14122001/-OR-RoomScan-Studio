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
Planning and scaffolding only. Third-party dependencies are not vendored. The QuestRoomScan adapter, Meta Depth API wiring, CAD import/registration, exporters, and device validation remain to be implemented.

## License
No project license has been selected yet. Do not assume this repository is open for reuse until a license is added. Third-party dependencies retain their own licenses.
