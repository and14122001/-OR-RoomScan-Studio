using UnityEngine;

/// <summary>
/// Presentation toggles only. Bind dynamic occlusion to Meta's official Depth API.
/// Occlusion is not collision safety or metrology.
/// </summary>
public class RoomVirtualizationController : MonoBehaviour
{
    [SerializeField] private GameObject passthroughReference;
    [SerializeField] private GameObject reconstructedScanMesh;
    [SerializeField] private GameObject virtualRoomShell;

    public bool DynamicOcclusionRequested { get; private set; }
    public bool IsVisualizationOnly { get; private set; } = true;

    public void SetPassthroughReference(bool visible)
    { if (passthroughReference) passthroughReference.SetActive(visible); }

    public void SetScanMeshVisible(bool visible)
    { if (reconstructedScanMesh) reconstructedScanMesh.SetActive(visible); }

    public void SetVirtualRoomVisible(bool visible)
    { if (virtualRoomShell) virtualRoomShell.SetActive(visible); }

    public void RequestDynamicOcclusion(bool enabled)
    {
        DynamicOcclusionRequested = enabled;
        Debug.LogWarning("Request recorded only; bind and validate Meta Environment Depth before claiming occlusion is active.");
    }

    public void SetMeasurementValidation(bool validated)
    {
        IsVisualizationOnly = !validated;
        if (!validated)
            Debug.LogWarning("Measurements are unvalidated; show approximate/visualization-only status.");
    }
}
