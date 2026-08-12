import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"
import { APP_CONFIG } from "@/lib/config"
import { classifyDeviation } from "@/lib/anomaly"
import { getRoleFromClerk, getRegionScope } from "@/lib/auth"

export async function getAnalyticalReport(
  region?: string, 
  page: number = 1, 
  limit: number = 5,
  sortBy: string = 'siteNumber',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const role = await getRoleFromClerk();
  const regionScope = await getRegionScope(role);
  let effectiveRegion = regionScope ?? region;
  if (effectiveRegion === "ALL" || effectiveRegion === "undefined" || effectiveRegion === "null" || effectiveRegion === "") {
    effectiveRegion = undefined;
  }

  const skip = (page - 1) * limit;
  const where = effectiveRegion ? { region: effectiveRegion } : {};

  // Validate sortBy to prevent arbitrary SQL/Prisma field injection
  const ALLOWED_SORT = ['siteNumber', 'location'] as const;
  const safeSortBy = ALLOWED_SORT.includes(sortBy as any) ? sortBy : 'siteNumber';

  const orderBy: Prisma.SiteOrderByWithRelationInput = safeSortBy === 'siteNumber'
    ? { siteId: sortOrder }
    : { name: sortOrder };

  const [sites, total] = await Promise.all([
    prisma.site.findMany({
      where,
      include: {
        generator: true,
        fuelRefills: {
          orderBy: { refillDate: 'desc' },
        }
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.site.count({ where })
  ]);

  const data = sites.map(site => {
    // Both liters and running hours are computed from the same source —
    // fuelRefill records — since a refill can exist without a linked
    // FuelRequest (e.g. ad-hoc/manual refills) and would otherwise
    // contribute hours but zero liters, skewing variance.
    let totalRefueled = 0;
    let totalRunningHours = 0;
    for (const refill of site.fuelRefills) {
      totalRefueled += refill.fuelDelivered || 0;
      const diff = (refill.afterHours || 0) - (refill.beforeHours || 0);
      totalRunningHours += diff > 0 ? diff : 0;
    }

    const amountInBirr = totalRefueled * APP_CONFIG.FUEL_UNIT_PRICE;

    const stdConsumption = site.generator?.stdFuelConsumption || 0;
    const expectedConsumption = stdConsumption * totalRunningHours;
    const { deviation: variance, anomalyLevel, reason: anomalyReason } =
      classifyDeviation(totalRefueled, stdConsumption, totalRunningHours);

    return {
      siteNumber: site.siteId,
      location: site.name,
      totalRefueled,
      totalRunningHours,
      amountInBirr,
      variance,
      expectedConsumption,
      anomalyLevel,
      anomalyReason,
    };
  });

  return { data, total };
}

/**
 * Finds the refill immediately preceding `refill` for the same site, using
 * a compound (refillDate, id) ordering so that multiple refills recorded on
 * the same date are broken deterministically instead of being skipped
 * entirely (a plain `refillDate <` comparison would ignore same-date ties).
 */
function findPreviousRefill<T extends { id: number; refillDate: Date }>(refill: T, allRefills: T[]): T | null {
  const sorted = [...allRefills].sort((a, b) => {
    const dateDiff = a.refillDate.getTime() - b.refillDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.id - b.id;
  });
  const idx = sorted.findIndex(r => r.id === refill.id);
  return idx > 0 ? sorted[idx - 1] : null;
}

type JournalRefill = {
  id: number;
  refillDate: Date;
  fuelDelivered: number;
  afterHours: number | null;
  beforeHours: number | null;
  unitPrice: number | null;
  technicianName: string | null;
  technicianIdStr: string | null;
  workOrderNumber: string | null;
  fuelRequest: { workOrderNumber: string | null } | null;
  site: {
    siteId: string;
    name: string;
    region: string | null;
    tankerCapacity: number | null;
    generator: { stdFuelConsumption: number | null } | null;
    fuelRefills: { id: number; refillDate: Date; afterHours: number | null; beforeHours: number | null; fuelDelivered: number }[];
  };
};

/** Shared row-mapping logic used by both the table view and the export, so they can never diverge. */
function mapRefillToJournalRow(refill: JournalRefill, sn: number) {
  const site = refill.site;
  const prevRefill = findPreviousRefill(refill, site.fuelRefills);

  const currHr = refill.afterHours || 0;
  // Derived from the previous refill's own afterHours reading (the meter
  // value once that refill was completed) — not its beforeHours, which
  // would reach one refill further back and inflate the hour difference.
  const prevHr = prevRefill ? (prevRefill.afterHours || 0) : 0;
  const runningHrs = currHr - prevHr;

  const actualRefueled = refill.fuelDelivered || 0;
  const unitPrice = refill.unitPrice || APP_CONFIG.FUEL_UNIT_PRICE;
  const stdConsumption = site.generator?.stdFuelConsumption || 0;
  const { deviation, deviationPct, anomalyLevel, reason: anomalyReason } =
    classifyDeviation(actualRefueled, stdConsumption, runningHrs);

  return {
    sn,
    employeeCreatedWO: refill.technicianName || "System",
    employeeIdWOCreate: refill.technicianIdStr || "SYS-001",
    workOrderNumber: refill.workOrderNumber || refill.fuelRequest?.workOrderNumber || "N/A",
    siteId: site.siteId,
    siteName: site.name,
    region: site.region || "-",
    tankerCapacity: site.tankerCapacity || 0,
    standard: stdConsumption,
    prevRefuelDate: prevRefill ? prevRefill.refillDate.toLocaleDateString() : "-",
    prevRefuelLiters: prevRefill ? prevRefill.fuelDelivered : 0,
    prevRefuelBirr: prevRefill ? prevRefill.fuelDelivered * unitPrice : 0,
    prevRefuelRunningHour: prevHr,
    currRefuelDate: refill.refillDate.toLocaleDateString(),
    currRefuelLiters: actualRefueled,
    currRefuelBirr: actualRefueled * unitPrice,
    currRefuelRunningHour: currHr,
    runningHourDifference: runningHrs,
    runningHrPerLit: actualRefueled > 0 ? (runningHrs / actualRefueled) : 0,
    maintOpSeq: "-",
    deviation,
    deviationPct,
    anomalyLevel,
    anomalyReason,
    unitPrice: unitPrice,
    remark: "",
  };
}

function journalOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): Prisma.FuelRefillOrderByWithRelationInput {
  switch (sortBy) {
    case 'currRefuelDate':
      return { refillDate: sortOrder };
    case 'siteId':
      return { site: { siteId: sortOrder } };
    case 'siteName':
      return { site: { name: sortOrder } };
    case 'employeeCreatedWO':
      return { technicianName: sortOrder };
    case 'employeeIdWOCreate':
      return { technicianIdStr: sortOrder };
    case 'workOrderNumber':
      return { workOrderNumber: sortOrder };
    case 'region':
      return { site: { region: sortOrder } };
    case 'tankerCapacity':
      return { site: { tankerCapacity: sortOrder } };
    case 'standard':
      return { site: { generator: { stdFuelConsumption: sortOrder } } };
    case 'unitPrice':
      return { unitPrice: sortOrder };
    case 'currRefuelLiters':
      return { fuelDelivered: sortOrder };
    default:
      // safe fallback
      return { refillDate: sortOrder };
  }
}

export async function getFuelJournalData(
  region?: string, 
  page: number = 1, 
  limit: number = 5,
  sortBy: string = 'currRefuelDate',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const role = await getRoleFromClerk();
  const regionScope = await getRegionScope(role);
  let effectiveRegion = regionScope ?? region;
  if (effectiveRegion === "ALL" || effectiveRegion === "undefined" || effectiveRegion === "null" || effectiveRegion === "") {
    effectiveRegion = undefined;
  }

  const skip = (page - 1) * limit;
  const where = effectiveRegion ? { site: { region: effectiveRegion } } : {};
  const orderBy = journalOrderBy(sortBy, sortOrder);

  const [refills, total] = await Promise.all([
    prisma.fuelRefill.findMany({
      where,
      include: { 
        site: { 
          include: { 
            generator: true,
            fuelRefills: {
              orderBy: { refillDate: 'desc' }
            }
          } 
        },
        fuelRequest: true
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.fuelRefill.count({ where })
  ]);

  const data = refills.map((refill, i) => mapRefillToJournalRow(refill, skip + i + 1));

  return { data, total };
}

export async function getFuelJournalExportData(
  region?: string,
  sortBy: string = 'currRefuelDate',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const where = region ? { site: { region } } : {};
  const orderBy = journalOrderBy(sortBy, sortOrder);

  const refills = await prisma.fuelRefill.findMany({
    where,
    include: { 
      site: { 
        include: { 
          generator: true,
          fuelRefills: {
            orderBy: { refillDate: 'desc' }
          }
        } 
      },
      fuelRequest: true
    },
    orderBy,
  });

  return refills.map((refill, i) => mapRefillToJournalRow(refill, i + 1));
}
