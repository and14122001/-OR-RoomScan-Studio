using System;
using System.Collections.Generic;
using UnityEngine;

public static class MeasurementStats
{
    public static float MeanAbsoluteError(IReadOnlyList<float> errors)
    {
        if (errors == null || errors.Count == 0) throw new ArgumentException("At least one error is required.");
        double sum = 0;
        foreach (float e in errors) sum += Math.Abs(e);
        return (float)(sum / errors.Count);
    }

    public static float RootMeanSquareError(IReadOnlyList<float> errors)
    {
        if (errors == null || errors.Count == 0) throw new ArgumentException("At least one error is required.");
        double sum = 0;
        foreach (float e in errors) sum += (double)e * e;
        return (float)Math.Sqrt(sum / errors.Count);
    }

    public static float MaxAbsoluteError(IReadOnlyList<float> errors)
    {
        if (errors == null || errors.Count == 0) throw new ArgumentException("At least one error is required.");
        float max = 0;
        foreach (float e in errors) max = Mathf.Max(max, Mathf.Abs(e));
        return max;
    }
}
