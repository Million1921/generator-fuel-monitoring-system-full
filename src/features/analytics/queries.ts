import prisma from "@/lib/db"
import { APP_CONFIG } from "@/lib/config"

export async function getAnalyticalReport(
  region?: string, 
  page: number = 1, 
  limit: number = 5,
  sortBy: string = 'siteNumber',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const skip = (page - 1) * limit;
  const where = region ? { region } : {};

  let orderBy: any = { [sortBy]: sortOrder };
  if (sortBy === 'siteNumber') {
    orderBy = { siteId: sortOrder };
  } else if (sortBy === 'location') {
    orderBy = { name: sortOrder };
  }

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

    const expectedConsumption = site.generator ? ((site.generator.stdFuelConsumption || 0) * totalRunningHours) : 0;
    const variance = totalRefueled - expectedConsumption;

    return {
      siteNumber: site.siteId,
      location: site.name,
      totalRefueled,
      totalRunningHours,
      amountInBirr,
      variance
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

  return {
    sn,
    employeeCreatedWO: refill.technicianName || "System",
    employeeIdWOCreate: refill.technicianIdStr || "SYS-001",
    workOrderNumber: refill.workOrderNumber || refill.fuelRequest?.workOrderNumber || "N/A",
    siteId: site.siteId,
    siteName: site.name,
    region: site.region || "-",
    tankerCapacity: site.tankerCapacity || 0,
    standard: site.generator?.stdFuelConsumption || 0,
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
    deviation: (actualRefueled - (site.generator?.stdFuelConsumption || 0) * runningHrs),
    unitPrice: unitPrice,
    remark: "",
  };
}

function journalOrderBy(sortBy: string, sortOrder: 'asc' | 'desc') {
  if (sortBy === 'currRefuelDate') return { refillDate: sortOrder };
  if (sortBy === 'siteId') return { site: { siteId: sortOrder } };
  if (sortBy === 'siteName') return { site: { name: sortOrder } };
  return { [sortBy]: sortOrder } as any;
}

export async function getFuelJournalData(
  region?: string, 
  page: number = 1, 
  limit: number = 5,
  sortBy: string = 'currRefuelDate',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;
  const where = region ? { site: { region } } : {};
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
