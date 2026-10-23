# Unity project setup (Quest 3)

## Current baseline
- Unity **6.2 (6000.2+)** with Android Build Support, Android SDK & NDK Tools, and OpenJDK.
- QuestRoomScan pinned to `v1.3.2` in `Packages/manifest.json`.
- URP and AR Foundation package versions are pinned in the manifest.
- This is a source project baseline, **not yet a verified build**.

## Required editor setup
1. Open the `Unity/` folder in Unity 6.2 or newer.
2. Let Package Manager resolve packages. Resolve any version conflict before proceeding; do not silently upgrade QuestRoomScan.
3. Install the Meta XR SDK / Meta OpenXR packages using Meta's official installation flow. The QuestRoomScan README lists `com.unity.xr.meta-openxr`, `com.unity.xr.openxr`, and `com.meta.xr.sdk.core` as additional project-level dependencies.
4. In the Unity menu, open **RoomScan > Setup Scene** and run **Apply Game-Ready Setup**. After the build-target/domain reload, run it again if prompted. This wizard configures Quest build settings, URP, passthrough, scene support, anchors and permissions.
5. Run **OR RoomScan > Attach Runtime Controller To Active Scene**. This attaches the app HUD/controller to the generated `RoomScanSession` object and saves the active scene.
6. Add that scene to **File > Build Profiles/Build Settings > Scenes**. Set Android as the build platform, ARM64 / IL2CPP, and build an APK. You can also run the GitHub Actions workflow after configuring Unity licensing secrets. Connect Quest 3 with Developer Mode and USB debugging enabled; install the APK using Build And Run or Android Platform Tools.

## Runtime controls
The prototype controller uses XR controller primary/secondary buttons as Start Scan / Finalize & Save. A saved scan can be loaded on app launch. Confirm bindings on-device; this input layer is intentionally small and does not replace the vendor debug menu.

## Known blockers / honest status
- The Meta XR SDK packages and their exact compatible versions must be installed/resolved in Unity Editor.
- The RoomScan setup wizard must generate the Meta-specific scene/project configuration.
- No Unity Editor build or Quest 3 device is available to this repository automation, so APK generation and device launch are **not yet verified**.
- This prototype is for visualization and workflow validation. It is not a medical device or survey instrument; do not claim ±1 mm accuracy without independent validation.
- Do not infer or modify medical-gas pipe sizes, flow, pressure or valve locations.
