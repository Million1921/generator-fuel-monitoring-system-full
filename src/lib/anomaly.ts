/**
 * Anomaly / Fuel Theft Detection Engine
 *
 * All thresholding logic lives here so it can be:
 *   - tested independently of the DB or HTTP layer
 *   - reused across the journal query, the analytics report, and any future
 *     alert/notification pipeline
 *
 * Terminology
 * -----------
 *   deviation  = actualRefueled - (stdConsumption × runningHours)
 *   deviationPct = deviation / expected × 100
 *
 *   Positive deviation → more fuel was pumped than the generator needed.
 *     Could indicate a legitimate top-up, over-delivery, meter error,
 *     or (in large amounts) potential fuel diversion.
 *
 *   Negative deviation → less fuel than expected was pumped.
 *     Could indicate engine efficiency gain, under-reporting,
 *     or (in large amounts) possible siphoning between refills.
 */

export type AnomalyLevel = 'normal' | 'warning' | 'critical';

export interface AnomalyResult {
  /** Raw litre difference: actual − (std × hours) */
  deviation: number;
  /** Percentage deviation relative to expected consumption (0 if expected === 0) */
  deviationPct: number;
  /** Classification based on thresholds */
  anomalyLevel: AnomalyLevel;
  /** Human-readable reason shown in the UI */
  reason: string;
}

/**
 * Thresholds — tune these centrally without touching any component or query.
 *
 *  WARNING  : |deviationPct| >= 20 %   (1-in-5 chance of a measurement issue)
 *  CRITICAL : |deviationPct| >= 40 %   (likely error, possible theft/diversion)
 *
 * We always flag BOTH over- and under-consumption symmetrically because both
 * directions are operationally meaningful:
 *   over  → potential over-delivery / invoice inflation
 *   under → potential theft between refills / meter tampering
 */
export const ANOMALY_THRESHOLDS = {
  WARNING_PCT: 20,
  CRITICAL_PCT: 40,
} as const;

export function classifyDeviation(
  actualRefueled: number,
  stdFuelConsumption: number,
  runningHours: number,
): AnomalyResult {
  const expected = stdFuelConsumption * runningHours;
  const deviation = actualRefueled - expected;

  // Avoid divide-by-zero when a generator has no standard consumption set,
  // or when there are zero running hours (e.g. first-ever refill for a site).
  const deviationPct = expected > 0 ? (Math.abs(deviation) / expected) * 100 : 0;

  let anomalyLevel: AnomalyLevel;
  let reason: string;

  if (expected === 0) {
    anomalyLevel = 'normal';
    reason = 'No standard consumption baseline available.';
  } else if (deviationPct >= ANOMALY_THRESHOLDS.CRITICAL_PCT) {
    anomalyLevel = 'critical';
    reason = deviation > 0
      ? `Over-delivery: ${deviationPct.toFixed(1)}% above expected — possible invoice inflation or meter error.`
      : `Under-consumption: ${deviationPct.toFixed(1)}% below expected — possible fuel siphoning or meter tampering.`;
  } else if (deviationPct >= ANOMALY_THRESHOLDS.WARNING_PCT) {
    anomalyLevel = 'warning';
    reason = deviation > 0
      ? `Elevated delivery: ${deviationPct.toFixed(1)}% above expected — worth monitoring.`
      : `Low consumption: ${deviationPct.toFixed(1)}% below expected — worth monitoring.`;
  } else {
    anomalyLevel = 'normal';
    reason = `Within normal range (${deviationPct.toFixed(1)}% deviation).`;
  }

  return { deviation, deviationPct, anomalyLevel, reason };
}
