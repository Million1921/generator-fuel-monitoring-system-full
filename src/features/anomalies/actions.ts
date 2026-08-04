"use server"

import prisma from "@/lib/db"
import { requireAbility } from "@/lib/auth"
import { classifyDeviation, AnomalyLevel } from "@/lib/anomaly"
import { APP_CONFIG } from "@/lib/config"

export interface FlaggedAnomaly {
  refillId: number;
  refillDate: string;
  siteId: string;
  siteName: string;
  region: string;
  actualRefueled: number;
  expectedRefueled: number;
  deviation: number;
  deviationPct: number;
  anomalyLevel: AnomalyLevel;
  reason: string;
  technicianName: string | null;
  workOrderNumber: string | null;
}

/**
 * Returns all fuel refill records that cross the WARNING or CRITICAL
 * deviation threshold, sorted most-severe-first.
 *
 * Called from the analytics dashboard and any future notification pipeline.
 */
export async function getFlaggedAnomalies(
  region?: string,
  minLevel: 'warning' | 'critical' = 'warning'
): Promise<FlaggedAnomaly[]> {
  await requireAbility("read", "FuelRefill")

  const refills = await prisma.fuelRefill.findMany({
    where: region ? { site: { region } } : undefined,
    include: {
      site: {
        include: {
          generator: true,
          fuelRefills: { orderBy: { refillDate: 'desc' } }
        }
      },
      fuelRequest: true,
    },
    orderBy: { refillDate: 'desc' },
  })

  const flagged: FlaggedAnomaly[] = []

  for (const refill of refills) {
    const site = refill.site
    const stdConsumption = site.generator?.stdFuelConsumption ?? 0

    // Derive running hours from the previous refill for the same site,
    // using the same deterministic ordering as mapRefillToJournalRow.
    const sorted = [...site.fuelRefills].sort((a, b) => {
      const d = a.refillDate.getTime() - b.refillDate.getTime()
      return d !== 0 ? d : a.id - b.id
    })
    const idx = sorted.findIndex(r => r.id === refill.id)
    const prevRefill = idx > 0 ? sorted[idx - 1] : null
    const runningHrs = (refill.afterHours ?? 0) - (prevRefill?.afterHours ?? 0)

    const actual = refill.fuelDelivered ?? 0
    const { deviation, deviationPct, anomalyLevel, reason } =
      classifyDeviation(actual, stdConsumption, runningHrs > 0 ? runningHrs : 0)

    // Filter: skip rows below the requested minimum severity
    if (anomalyLevel === 'normal') continue
    if (minLevel === 'critical' && anomalyLevel !== 'critical') continue

    const expected = stdConsumption * (runningHrs > 0 ? runningHrs : 0)

    flagged.push({
      refillId: refill.id,
      refillDate: refill.refillDate.toLocaleDateString(),
      siteId: site.siteId,
      siteName: site.name,
      region: site.region ?? '-',
      actualRefueled: actual,
      expectedRefueled: expected,
      deviation,
      deviationPct,
      anomalyLevel,
      reason,
      technicianName: refill.technicianName ?? null,
      workOrderNumber: refill.workOrderNumber ?? refill.fuelRequest?.workOrderNumber ?? null,
    })
  }

  // Sort: critical first, then by absolute deviation descending
  flagged.sort((a, b) => {
    if (a.anomalyLevel !== b.anomalyLevel) {
      return a.anomalyLevel === 'critical' ? -1 : 1
    }
    return Math.abs(b.deviation) - Math.abs(a.deviation)
  })

  return flagged
}

/**
 * Summary counts used by the dashboard header/alert banner.
 */
export async function getAnomalySummary(region?: string) {
  await requireAbility("read", "FuelRefill")
  const all = await getFlaggedAnomalies(region, 'warning')
  return {
    total: all.length,
    critical: all.filter(a => a.anomalyLevel === 'critical').length,
    warning: all.filter(a => a.anomalyLevel === 'warning').length,
  }
}
