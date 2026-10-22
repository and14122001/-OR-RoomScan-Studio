using System;
using UnityEngine;

/// <summary>
/// App-facing contract. Wire this to the installed QuestRoomScan package in a
/// project-specific adapter; do not assume third-party API signatures are stable.
/// </summary>
public class RoomScanSessionBridge : MonoBehaviour
{
    public enum ScanState { Idle, Scanning, Paused, Finalizing, Saved, Error }
    public ScanState State { get; private set; } = ScanState.Idle;
    public event Action<ScanState> StateChanged;
    public event Action<string> StatusMessage;

    public void SetState(ScanState state, string message = "")
    {
        State = state;
        StateChanged?.Invoke(state);
        if (!string.IsNullOrWhiteSpace(message)) StatusMessage?.Invoke(message);
    }

    public void RequestStartScan() =>
        StatusMessage?.Invoke("TODO: connect to the pinned QuestRoomScan scanning API.");

    public void RequestStopAndSave() =>
        StatusMessage?.Invoke("TODO: stop/finalize scan and verify persistence.");

    public void RequestLoadScan(string packageId) =>
        StatusMessage?.Invoke("TODO: load scan package and restore its anchor transform.");
}
