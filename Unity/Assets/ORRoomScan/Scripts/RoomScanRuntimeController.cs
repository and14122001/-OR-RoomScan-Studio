using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.XR;
using Genesis.RoomScan;

/// <summary>
/// Quest 3 runtime entry point. Attach to the root created by QuestRoomScan's
/// Game-Ready Setup wizard. A small headset HUD exposes controls and status.
/// </summary>
public sealed class RoomScanRuntimeController : MonoBehaviour
{
    [SerializeField] private bool loadLatestScanOnStart = true;
    [SerializeField] private bool useControllerButtons = true;
    [SerializeField] private bool showHeadsetHud = true;

    private bool busy;
    private bool previousPrimary;
    private bool previousSecondary;
    private string status = "Ready. A/X: start scan; B/Y: finish and save.";
    private Text hudText;
    private RoomScanSession session;

    private async void Start()
    {
        session = RoomScanSession.Instance;
        if (showHeadsetHud) CreateHud();

        if (session == null)
        {
            SetStatus("Setup incomplete: RoomScanSession not found. Run RoomScan > Setup Scene > Apply Game-Ready Setup.");
            return;
        }

        SetStatus("Ready. A/X: start scan; B/Y: finish and save.");
        if (!loadLatestScanOnStart) return;

        await RunSafely(async () =>
        {
            session = RoomScanSession.Instance;
            if (session != null && session.HasSavedScan)
            {
                SetStatus("Loading latest saved room scan…");
                await session.LoadLatestAsync();
                SetStatus("Saved room scan loaded. A/X: rescan; B/Y: finish and save.");
            }
            else
            {
                SetStatus("No saved scan. A/X: start scanning; B/Y: finish and save.");
            }
        });
    }

    private void Update()
    {
        if (!useControllerButtons || busy) return;

        bool primary = ReadAnyControllerButton(CommonUsages.primaryButton);
        bool secondary = ReadAnyControllerButton(CommonUsages.secondaryButton);

        if (primary && !previousPrimary)
        {
            _ = RunSafely(async () =>
            {
                session = RoomScanSession.Instance;
                if (session == null) throw new InvalidOperationException("RoomScanSession is missing. Run the Game-Ready Setup wizard.");
                SetStatus("Starting scan… keep the headset steady for a moment.");
                await session.StartScanAsync();
                SetStatus("Scanning. Slowly look around the room. Press B/Y to finish and save.");
            });
        }

        if (secondary && !previousSecondary)
        {
            _ = RunSafely(async () =>
            {
                session = RoomScanSession.Instance;
                if (session == null) throw new InvalidOperationException("RoomScanSession is missing. Run the Game-Ready Setup wizard.");
                SetStatus("Finishing scan, refining mesh and saving. This may take several minutes…");
                var result = await session.FinalizeScanAsync();
                string id = string.IsNullOrWhiteSpace(result.PackageId) ? "(package ID unavailable)" : result.PackageId;
                SetStatus($"Saved scan: {id}\nPress A/X to start a new scan.");
            });
        }

        previousPrimary = primary;
        previousSecondary = secondary;
    }

    private void CreateHud()
    {
        Camera cam = Camera.main;
        if (cam == null)
        {
            Debug.LogWarning("[OR RoomScan] HUD not created: no MainCamera found.");
            return;
        }

        var canvasObject = new GameObject("ORRoomScan_StatusHUD", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler));
        canvasObject.transform.SetParent(cam.transform, false);
        canvasObject.transform.localPosition = new Vector3(0f, -0.20f, 1.25f);
        canvasObject.transform.localRotation = Quaternion.identity;
        canvasObject.transform.localScale = Vector3.one * 0.001f;

        var canvas = canvasObject.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.WorldSpace;
        canvas.worldCamera = cam;
        var rect = canvasObject.GetComponent<RectTransform>();
        rect.sizeDelta = new Vector2(900f, 220f);

        var panel = new GameObject("Panel", typeof(RectTransform), typeof(Image));
        panel.transform.SetParent(canvasObject.transform, false);
        var panelRect = panel.GetComponent<RectTransform>();
        panelRect.anchorMin = Vector2.zero;
        panelRect.anchorMax = Vector2.one;
        panelRect.offsetMin = Vector2.zero;
        panelRect.offsetMax = Vector2.zero;
        panel.GetComponent<Image>().color = new Color(0.02f, 0.04f, 0.06f, 0.82f);

        var textObject = new GameObject("StatusText", typeof(RectTransform), typeof(Text));
        textObject.transform.SetParent(panel.transform, false);
        var textRect = textObject.GetComponent<RectTransform>();
        textRect.anchorMin = Vector2.zero;
        textRect.anchorMax = Vector2.one;
        textRect.offsetMin = new Vector2(24f, 16f);
        textRect.offsetMax = new Vector2(-24f, -16f);
        hudText = textObject.GetComponent<Text>();
        hudText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        hudText.fontSize = 30;
        hudText.color = Color.white;
        hudText.alignment = TextAnchor.MiddleLeft;
        hudText.horizontalOverflow = HorizontalWrapMode.Wrap;
        hudText.verticalOverflow = VerticalWrapMode.Overflow;
        hudText.text = status;
    }

    private void SetStatus(string message)
    {
        status = message;
        if (hudText != null) hudText.text = message;
        Debug.Log("[OR RoomScan] " + message.Replace("\n", " | "));
    }

    private static bool ReadAnyControllerButton(InputFeatureUsage<bool> usage)
    {
        var devices = new List<InputDevice>();
        InputDevices.GetDevicesWithCharacteristics(InputDeviceCharacteristics.Controller, devices);
        foreach (var device in devices)
        {
            if (device.isValid && device.TryGetFeatureValue(usage, out bool pressed) && pressed)
                return true;
        }
        return false;
    }

    private async Task RunSafely(Func<Task> operation)
    {
        if (busy) return;
        busy = true;
        try
        {
            await operation();
        }
        catch (Exception ex)
        {
            SetStatus("Operation failed: " + ex.Message + "\nCheck Unity logs and Quest permissions.");
            Debug.LogError("[OR RoomScan] Operation failed: " + ex);
        }
        finally
        {
            busy = false;
        }
    }
}
