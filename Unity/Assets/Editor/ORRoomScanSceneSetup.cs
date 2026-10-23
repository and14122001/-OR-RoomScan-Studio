#if UNITY_EDITOR
using Genesis.RoomScan;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

/// <summary>Connects this app's controller to the Game-Ready scene without
/// modifying upstream QuestRoomScan package files.</summary>
public static class ORRoomScanSceneSetup
{
    [MenuItem("OR RoomScan/Attach Runtime Controller To Active Scene")]
    public static void AttachRuntimeController()
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
            controller = Undo.AddComponent<RoomScanRuntimeController>(session.gameObject);

        EditorSceneManager.MarkSceneDirty(session.gameObject.scene);
        EditorSceneManager.SaveScene(session.gameObject.scene);
        Selection.activeGameObject = session.gameObject;
        Debug.Log("[OR RoomScan] Runtime controller attached and active scene saved.");
        EditorUtility.DisplayDialog(
            "OR RoomScan Studio",
            "Runtime controller attached. A/X starts a scan; B/Y finalizes and saves. Add this scene to Build Settings before building.",
            "OK");
    }
}
#endif
