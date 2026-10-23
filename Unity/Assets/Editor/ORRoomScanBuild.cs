#if UNITY_EDITOR
using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using Genesis.RoomScan;

/// <summary>
/// Reproducible Android build entry point. Refuses to produce an APK from an
/// unconfigured/empty scene, rather than reporting a false-success artifact.
/// </summary>
public static class ORRoomScanBuild
{
    public static void BuildAndroid()
    {
        if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.Android)
            throw new BuildFailedException(
                "Active build target is not Android. Switch to Android in Build Profiles, wait for Unity to reload, then run OR RoomScan > Build Quest 3 APK again.");

        var scenes = EditorBuildSettings.scenes
            .Where(s => s.enabled && !string.IsNullOrWhiteSpace(s.path) && File.Exists(s.path))
            .Select(s => s.path)
            .ToArray();

        if (scenes.Length == 0)
            throw new BuildFailedException(
                "No enabled scenes in Build Settings. Open Unity, run RoomScan > Setup Scene > Apply Game-Ready Setup, save the configured scene, and add it to Build Settings.");

        // Load each build scene temporarily to confirm the actual QRS runtime
        // components exist. Build must not pass with a blank template scene.
        for (int i = 0; i < scenes.Length; i++)
        {
            string scenePath = scenes[i];
            UnityEditor.SceneManagement.EditorSceneManager.OpenScene(
                scenePath,
                i == 0
                    ? UnityEditor.SceneManagement.OpenSceneMode.Single
                    : UnityEditor.SceneManagement.OpenSceneMode.Additive);
        }

        // Validate the assembled build scene set after all scenes are loaded.
        var session = UnityEngine.Object.FindFirstObjectByType<RoomScanSession>();
        var scanner = UnityEngine.Object.FindFirstObjectByType<RoomScanner>();
        var controller = UnityEngine.Object.FindFirstObjectByType<RoomScanRuntimeController>();
        if (session == null || scanner == null || controller == null)
            throw new BuildFailedException(
                "Build scenes are missing RoomScanSession, RoomScanner, or RoomScanRuntimeController. Run RoomScan > Setup Scene > Apply Game-Ready Setup, then OR RoomScan > Prepare Scene For APK.");

        PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
        PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
        PlayerSettings.defaultInterfaceOrientation = UIOrientation.LandscapeLeft;

        string outputDir = Path.GetFullPath(Path.Combine(Application.dataPath, "../Build/Android"));
        Directory.CreateDirectory(outputDir);
        string outputPath = Path.Combine(outputDir, "ORRoomScanStudio.apk");

        var options = new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = outputPath,
            target = BuildTarget.Android,
            options = BuildOptions.None
        };

        BuildReport report = BuildPipeline.BuildPlayer(options);
        if (report.summary.result != BuildResult.Succeeded || !File.Exists(outputPath))
            throw new BuildFailedException(
                $"Android build failed: result={report.summary.result}, errors={report.summary.totalErrors}, warnings={report.summary.totalWarnings}.");

        Debug.Log($"OR RoomScan Studio APK created: {outputPath} ({report.summary.totalSize} bytes).");
    }
}
#endif
