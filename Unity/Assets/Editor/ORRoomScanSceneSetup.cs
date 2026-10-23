#if UNITY_EDITOR
using System.IO;
using System.Linq;
using Genesis.RoomScan;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>Connects this app's controller to the Game-Ready scene without
/// modifying upstream QuestRoomScan package files.</summary>
public static class ORRoomScanSceneSetup
{
    [MenuItem("OR RoomScan/Prepare Scene For APK")]
    public static void PrepareSceneForApk()
    {
        var session = Object.FindFirstObjectByType<RoomScanSession>();
        if (session == null)
        {
            EditorUtility.DisplayDialog(
                "OR RoomScan Studio",
                "RoomScanSession was not found in the active scene. First run RoomScan > Setup Scene > Apply Game-Ready Setup, then retry.",
                "OK");
            return;
        }

        var controller = session.GetComponent<RoomScanRuntimeController>();
        if (controller == null)
            Undo.AddComponent<RoomScanRuntimeController>(session.gameObject);

        Scene scene = session.gameObject.scene;
        string scenePath = scene.path;
        if (string.IsNullOrWhiteSpace(scenePath))
        {
            const string sceneFolder = "Assets/Scenes";
            Directory.CreateDirectory(sceneFolder);
            scenePath = sceneFolder + "/ORRoomScan.unity";
        }

        EditorSceneManager.MarkSceneDirty(scene);
        if (!EditorSceneManager.SaveScene(scene, scenePath))
        {
            EditorUtility.DisplayDialog(
                "OR RoomScan Studio",
                "Unity could not save the configured scene. Check the Console and project write permissions.",
                "OK");
            return;
        }

        var scenes = EditorBuildSettings.scenes.ToList();
        var existing = scenes.FindIndex(s => s.path == scenePath);
        var enabledScene = new EditorBuildSettingsScene(scenePath, true);
        if (existing >= 0) scenes[existing] = enabledScene;
        else scenes.Add(enabledScene);
        EditorBuildSettings.scenes = scenes.ToArray();

        Selection.activeGameObject = session.gameObject;
        Debug.Log("[OR RoomScan] Runtime controller attached, scene saved, and scene enabled for builds: " + scenePath);
        EditorUtility.DisplayDialog(
            "OR RoomScan Studio",
            "Scene prepared for APK build. A/X starts scanning; B/Y finalizes and saves. Now use OR RoomScan > Build Quest 3 APK (or GitHub Actions after configuring Unity licensing).",
            "OK");
    }

    [MenuItem("OR RoomScan/Build Quest 3 APK")]
    public static void BuildQuest3Apk()
    {
        ORRoomScanBuild.BuildAndroid();
    }
}
#endif
