import { describe, it, expect } from 'vitest'
import { classifyDeviation, ANOMALY_THRESHOLDS } from './anomaly'

describe('classifyDeviation', () => {

  // ── Normal range ──────────────────────────────────────────────────────

  it('returns normal when deviation is within thresholds', () => {
    // expected = 10 * 5 = 50, actual = 55, deviation = 5, pct = 10%
    const result = classifyDeviation(55, 10, 5)
    expect(result.anomalyLevel).toBe('normal')
    expect(result.deviation).toBe(5)
    expect(result.deviationPct).toBeCloseTo(10, 1)
    expect(result.reason).toContain('Within normal range')
  })

  it('returns normal for exact match (0% deviation)', () => {
    const result = classifyDeviation(50, 10, 5)
    expect(result.anomalyLevel).toBe('normal')
    expect(result.deviation).toBe(0)
    expect(result.deviationPct).toBe(0)
  })

  // ── Warning range ─────────────────────────────────────────────────────

  it('returns warning for over-delivery at exactly WARNING_PCT', () => {
    // expected = 100, actual = 120, deviation = 20, pct = 20%
    const result = classifyDeviation(120, 10, 10)
    expect(result.anomalyLevel).toBe('warning')
    expect(result.deviationPct).toBeCloseTo(ANOMALY_THRESHOLDS.WARNING_PCT, 1)
    expect(result.reason).toContain('Elevated delivery')
    expect(result.reason).toContain('above expected')
  })

  it('returns warning for under-consumption at WARNING_PCT', () => {
    // expected = 100, actual = 80, deviation = -20, pct = 20%
    const result = classifyDeviation(80, 10, 10)
    expect(result.anomalyLevel).toBe('warning')
    expect(result.deviation).toBe(-20)
    expect(result.reason).toContain('Low consumption')
    expect(result.reason).toContain('below expected')
  })

  it('returns warning just above threshold but below critical', () => {
    // expected = 100, actual = 130, deviation = 30, pct = 30%
    const result = classifyDeviation(130, 10, 10)
    expect(result.anomalyLevel).toBe('warning')
    expect(result.deviationPct).toBeCloseTo(30, 1)
  })

  // ── Critical range ────────────────────────────────────────────────────

  it('returns critical for over-delivery at exactly CRITICAL_PCT', () => {
    // expected = 100, actual = 140, deviation = 40, pct = 40%
    const result = classifyDeviation(140, 10, 10)
    expect(result.anomalyLevel).toBe('critical')
    expect(result.deviationPct).toBeCloseTo(ANOMALY_THRESHOLDS.CRITICAL_PCT, 1)
    expect(result.reason).toContain('Over-delivery')
    expect(result.reason).toContain('invoice inflation')
  })

  it('returns critical for under-consumption beyond CRITICAL_PCT', () => {
    // expected = 100, actual = 50, deviation = -50, pct = 50%
    const result = classifyDeviation(50, 10, 10)
    expect(result.anomalyLevel).toBe('critical')
    expect(result.deviation).toBe(-50)
    expect(result.reason).toContain('Under-consumption')
    expect(result.reason).toContain('siphoning')
  })

  it('returns critical for extreme over-delivery', () => {
    // expected = 100, actual = 300, deviation = 200, pct = 200%
    const result = classifyDeviation(300, 10, 10)
    expect(result.anomalyLevel).toBe('critical')
    expect(result.deviationPct).toBeCloseTo(200, 1)
  })

  // ── Edge cases: zero expected ─────────────────────────────────────────

  it('returns normal with 0% deviation when stdFuelConsumption is 0', () => {
    const result = classifyDeviation(100, 0, 10)
    expect(result.anomalyLevel).toBe('normal')
    expect(result.deviationPct).toBe(0)
    expect(result.reason).toContain('No standard consumption baseline')
  })

  it('returns normal with 0% deviation when runningHours is 0', () => {
    const result = classifyDeviation(100, 10, 0)
    expect(result.anomalyLevel).toBe('normal')
    expect(result.deviationPct).toBe(0)
    expect(result.reason).toContain('No standard consumption baseline')
  })

  it('returns normal when all inputs are 0', () => {
    const result = classifyDeviation(0, 0, 0)
    expect(result.anomalyLevel).toBe('normal')
    expect(result.deviation).toBe(0)
    expect(result.deviationPct).toBe(0)
  })

  // ── Threshold boundary precision ──────────────────────────────────────

  it('returns normal just below WARNING_PCT', () => {
    // expected = 100, actual = 119.9, pct = 19.9%
    const result = classifyDeviation(119.9, 10, 10)
    expect(result.anomalyLevel).toBe('normal')
    expect(result.deviationPct).toBeLessThan(ANOMALY_THRESHOLDS.WARNING_PCT)
  })

  it('returns warning just below CRITICAL_PCT', () => {
    // expected = 100, actual = 139.9, pct = 39.9%
    const result = classifyDeviation(139.9, 10, 10)
    expect(result.anomalyLevel).toBe('warning')
    expect(result.deviationPct).toBeLessThan(ANOMALY_THRESHOLDS.CRITICAL_PCT)
  })
})

describe('ANOMALY_THRESHOLDS', () => {
  it('has sensible default values', () => {
    expect(ANOMALY_THRESHOLDS.WARNING_PCT).toBe(20)
    expect(ANOMALY_THRESHOLDS.CRITICAL_PCT).toBe(40)
  })

  it('warning is less than critical', () => {
    expect(ANOMALY_THRESHOLDS.WARNING_PCT).toBeLessThan(ANOMALY_THRESHOLDS.CRITICAL_PCT)
  })
})
