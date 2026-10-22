using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.XR;
using Genesis.RoomScan;

/// <summary>
/// Minimal runtime entry point for Quest 3. Add this to the RoomScan root
/// created by the QuestRoomScan Game-Ready Setup wizard.
/// This wires the documented high-level scan lifecycle; it does not claim
/// metrology accuracy or replace the vendor setup wizard.
/// </summary>
public sealed class RoomScanRuntimeController : MonoBehaviour
{
    [SerializeField] private bool loadLatestScanOnStart = true;
    [SerializeField] private bool useControllerButtons = true;

    private bool busy;
    private bool previousPrimary;
    private bool previousSecondary;

    private async void Start()
    {
        if (!loadLatestScanOnStart) return;
        await RunSafely(async () =>
        {
            var session = RoomScanSession.Instance;
            if (session != null && session.HasSavedScan)
            {
                await session.LoadLatestAsync();
                Debug.Log("[OR RoomScan] Latest saved scan loaded.");
            }
            else
            {
                Debug.Log("[OR RoomScan] No saved scan found; ready to scan.");
            }
        });
    }

    private void Update()
    {
        if (!useControllerButtons || busy) return;

        bool primary = ReadAnyControllerButton(CommonUsages.primaryButton);
        bool secondary = ReadAnyControllerButton(CommonUsages.secondaryButton);

        if (primary && !previousPrimary)
            _ = RunSafely(async () => await RoomScanSession.Instance.StartScanAsync());

        if (secondary && !previousSecondary)
            _ = RunSafely(async () => await RoomScanSession.Instance.FinalizeScanAsync());

        previousPrimary = primary;
        previousSecondary = secondary;
    }

    private static bool ReadAnyControllerButton(InputFeatureUsage<bool> usage)
    {
        var devices = new System.Collections.Generic.List<InputDevice>();
        InputDevices.GetDevicesWithCharacteristics(
            InputDeviceCharacteristics.Controller, devices);

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
            Debug.LogError("[OR RoomScan] Operation failed: " + ex);
        }
        finally
        {
            busy = false;
        }
    }
}
