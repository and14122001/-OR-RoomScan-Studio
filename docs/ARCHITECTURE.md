# Architecture

## Data flow
Quest 3 capture → QuestRoomScan reconstruction → persisted scan/mesh → CAD registration → deviation analysis → export/report.

- **QuestRoomScan:** dense reconstruction, mesh generation and scan persistence.
- **MRUK / Scene API:** room planes and semantic anchors; contextual geometry only.
- **Meta Depth API:** real-time dynamic occlusion for rendering, not measurement.
- **CAD pipeline:** import drawing with explicit units/layers, register to scan, compare surfaces.
- **QA pipeline:** uncertainty, repeatability, validation records and traceability.

## Safety states
- `PreviewOnly`: visualization only; measurements unvalidated.
- `AlignmentUnverified`: CAD overlay is provisional; display residuals.
- `MeasurementValidated`: allowed only after acceptance tests pass and evidence is saved.
- `MedicalDesignLocked`: original CAD/design layers read-only by default.

Persist scan origin, CAD units, axis convention, transform matrix, control-point IDs, residuals and timestamp. Never silently assume millimetres/metres or axis handedness.

## Precision policy
±1 mm is a test target, not a product claim. Use independent known dimensions, document reference-tool uncertainty, and keep calibration points separate from validation points. Report maximum absolute error, MAE, RMSE and repeat-scan spread. Visual quality and depth occlusion do not prove measurement accuracy.
