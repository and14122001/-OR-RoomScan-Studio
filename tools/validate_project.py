#!/usr/bin/env python3
"""Fast repository preflight; does not replace Unity compilation or device tests."""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
errors = []
manifest_path = ROOT / "Unity/Packages/manifest.json"
controller_path = ROOT / "Unity/Assets/ORRoomScan/Scripts/RoomScanRuntimeController.cs"
build_path = ROOT / "Unity/Assets/Editor/ORRoomScanBuild.cs"
workflow_path = ROOT / ".github/workflows/build-quest-apk.yml"
scene_setup_path = ROOT / "Unity/Assets/Editor/ORRoomScanSceneSetup.cs"
install_script_path = ROOT / "tools/install_quest3_apk.sh"

try:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"FAIL: invalid/missing Unity package manifest: {exc}")
    sys.exit(1)

deps = manifest.get("dependencies", {})
if deps.get("com.genesis.roomscan") != "https://github.com/genesisinteractive/QuestRoomScan.git#v1.3.2":
    errors.append("QuestRoomScan must remain pinned to v1.3.2.")
if deps.get("com.unity.xr.arfoundation") != "6.1.1":
    errors.append("AR Foundation must match QuestRoomScan v1.3.2 (6.1.1).")
if deps.get("com.meta.xr.sdk.core") != "205.0.0":
    errors.append("Meta XR Core must match the pinned QuestRoomScan/MRUK baseline (205.0.0).")
if deps.get("com.unity.xr.openxr") != "1.16.1":
    errors.append("OpenXR must be pinned to the validated Unity 6 baseline (1.16.1).")
if deps.get("com.unity.xr.meta-openxr") != "2.6.1":
    errors.append("Unity OpenXR Meta must be pinned to 2.6.1.")
if not (ROOT / "Unity/ProjectSettings/ProjectVersion.txt").is_file():
    errors.append("Unity ProjectVersion.txt is missing.")

controller = controller_path.read_text(encoding="utf-8") if controller_path.exists() else ""
for symbol in ("RoomScanSession.Instance", "StartScanAsync", "FinalizeScanAsync", "LoadLatestAsync"):
    if symbol not in controller:
        errors.append(f"Runtime controller is missing expected integration call: {symbol}")
# Scan all first-party C# source files, not just the main controller.
cs_files = [
    p for p in (ROOT / "Unity/Assets").rglob("*.cs")
    if not any(part in {"Library", "Temp", "Obj", "Build", "Builds"} for part in p.parts)
]
todo_files = []
for cs_path in cs_files:
    source = cs_path.read_text(encoding="utf-8", errors="replace")
    if "TODO:" in source or "TODO(" in source:
        todo_files.append(str(cs_path.relative_to(ROOT)))
if todo_files:
    errors.append("C# TODO placeholders remain: " + ", ".join(todo_files))

build = build_path.read_text(encoding="utf-8") if build_path.exists() else ""
for symbol in ("BuildPipeline.BuildPlayer", "RoomScanSession", "RoomScanner", "RoomScanRuntimeController", "AndroidArchitecture.ARM64", "com.and14122001.orroomscanstudio"):
    if symbol not in build:
        errors.append(f"Android build entry point is missing validation: {symbol}")

scene_setup = scene_setup_path.read_text(encoding="utf-8") if scene_setup_path.exists() else ""
if "Prepare Scene For APK" not in scene_setup or "EditorBuildSettings.scenes" not in scene_setup:
    errors.append("Scene preparation command must save/register the scene for Android builds.")

if not install_script_path.is_file():
    errors.append("Quest 3 install helper script is missing.")

workflow = workflow_path.read_text(encoding="utf-8") if workflow_path.exists() else ""
for symbol in ("ORRoomScanBuild.BuildAndroid", "UNITY_LICENSE", "Unity/Build/Android"):
    if symbol not in workflow:
        errors.append(f"APK workflow is missing expected configuration: {symbol}")

if errors:
    for error in errors:
        print("FAIL:", error)
    sys.exit(1)

print("PASS: repository preflight checks succeeded.")
print("NOTE: this checks repository wiring only; Unity compilation and Quest 3 device tests are still required.")
