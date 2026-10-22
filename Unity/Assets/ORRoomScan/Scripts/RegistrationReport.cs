using System;
using UnityEngine;

[Serializable]
public class RegistrationReport
{
    public string cadFileName;
    public string sourceUnits;
    public string coordinateConvention;
    public string timestampIso8601;
    public int controlPointCount;
    public float rmsResidualMm;
    public float maxResidualMm;
    public bool independentCheckPointsUsed;
    public bool validated;

    public bool CanClaimMeasurementValidated =>
        validated && independentCheckPointsUsed && controlPointCount >= 3 &&
        !string.IsNullOrWhiteSpace(sourceUnits) &&
        !string.IsNullOrWhiteSpace(coordinateConvention) &&
        !float.IsNaN(rmsResidualMm) && !float.IsInfinity(rmsResidualMm) &&
        !float.IsNaN(maxResidualMm) && !float.IsInfinity(maxResidualMm);
}
