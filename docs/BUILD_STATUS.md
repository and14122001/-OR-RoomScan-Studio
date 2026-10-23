# Build Status — 2026-10-23

## Verified in GitHub
- Unity project folder and package manifest are committed.
- QuestRoomScan is pinned to `v1.3.2`; the package's own manifest declares Unity `6000.2`, AR Foundation `6.1.1`, URP `17.0.3`, Burst `1.8.18`, Collections `2.4.3`, Mathematics `1.3.2`, and Meta MR Utility Kit `205.0.0`.
- A minimal runtime controller calls the documented `RoomScanSession` API for scan start, finalize/save, and load-latest.
- A headset HUD/controller script exposes scan start, finalize/save, and load-latest.
- An Editor menu command attaches the runtime controller to the Game-Ready scene.
- A guarded Android ARM64 build entry point validates the configured scene set, checks the required Android xatlas native plugin, sets the app ID, and builds the APK.
- A repeatable ADB helper installs and launches the APK on an authorized Quest/Android device.
- A manual GitHub Actions workflow runs repository preflight, then attempts the licensed Unity build and uploads the APK artifact.

## Latest CI results (2026-10-23)
- Browser simulator validation workflow passed after adding local-session schema, dimension, and point-boundary checks: [run history](https://github.com/and14122001/-OR-RoomScan-Studio/actions).
- GitHub Pages deployment is still blocked because the repository Pages site is not enabled and the workflow token is not authorized to create the Pages site. Repository owner/admin must set **Settings → Pages → Build and deployment → Source: GitHub Actions**; then rerun the deploy workflow.
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
