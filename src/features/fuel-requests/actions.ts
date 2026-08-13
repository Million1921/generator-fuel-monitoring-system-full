"use server"

import { revalidatePath } from "next/cache"
import { requireAbility, AuthError } from "@/lib/auth"
import { subject } from "@casl/ability"
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { logger } from "@/lib/server-utils"
import { z } from "zod"

export async function getPendingRequests(region?: string) {
  await requireAbility("read", "FuelRequest")
  return await prisma.fuelRequest.findMany({
    where: {
      status: { in: ['PENDING_SUPERVISOR', 'PENDING'] },
      ...(region ? { site: { region } } : {})
    },
    include: {
      site: {
        include: {
          generator: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getDeliverySites(region?: string) {
  await requireAbility("read", "Site")
  return await prisma.site.findMany({
    where: region ? { region } : {},
    include: { generator: true },
    orderBy: { name: 'asc' }
  })
}

export async function getApprovedRequests(siteId?: number) {
  await requireAbility("read", "FuelRequest")
  return await prisma.fuelRequest.findMany({
    where: {
      status: { in: ["ASSIGNED_TO_TECH", "FUNDS_RELEASED_TO_FLEET_ADMIN"] },
      ...(siteId ? { siteId } : {})
    },
    include: { site: true, technician: true },
    orderBy: { createdAt: 'desc' }
  })
}

export interface FuelDeliveryData {
  siteId: string;
  actualRefueled: number;
  begRunningHour: number;
  endRunningHour: number;
  fuelBeforeRefuel: number;
  unitPrice: number;
  driverName?: string;
  driverId?: string;
  technicianName?: string;
  technicianId?: string;
  employmentType?: string;
  requestId?: string;
  workOrderNumber?: string;
  eepu?: number;
  remark?: string;
  department?: string;
}

// Server-side validation for the delivery payload. Client-side zod schemas
// (see src/schemas/fuel.ts) are UX only — the server owns the real check.
const FuelDeliveryServerSchema = z.object({
  siteId: z.coerce.number().int().positive(),
  actualRefueled: z.coerce.number().positive(),
  begRunningHour: z.coerce.number().nonnegative(),
  endRunningHour: z.coerce.number().nonnegative(),
  fuelBeforeRefuel: z.coerce.number().nonnegative(),
  unitPrice: z.coerce.number().positive(),
  driverName: z.string().optional(),
  driverId: z.string().optional(),
  technicianName: z.string().optional(),
  technicianId: z.string().optional(),
  employmentType: z.string().optional(),
  requestId: z.string().optional(),
  workOrderNumber: z.string().optional(),
  eepu: z.coerce.number().optional(),
  remark: z.string().optional(),
  department: z.string().optional(),
}).refine((data) => data.endRunningHour >= data.begRunningHour, {
  message: "End hours cannot be less than start hours",
  path: ["endRunningHour"],
})

export async function createFuelDelivery(data: FuelDeliveryData) {
  await requireAbility("create", "FuelRefill")

  const parsed = FuelDeliveryServerSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid fuel delivery data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  try {
    const siteId = validated.siteId;

    const refill = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create a FuelRefill record
      const refill = await tx.fuelRefill.create({
        data: {
          siteId: siteId,
          fuelDelivered: validated.actualRefueled,
          beforeLevel: validated.fuelBeforeRefuel,
          afterLevel: validated.fuelBeforeRefuel + validated.actualRefueled,
          beforeHours: validated.begRunningHour,
          afterHours: validated.endRunningHour,
          driverName: validated.driverName,
          driverId: validated.driverId,
          technicianName: validated.technicianName,
          technicianIdStr: validated.technicianId,
          employmentType: validated.employmentType,
          fuelRequestId: validated.requestId ? parseInt(validated.requestId) : null,
          workOrderNumber: validated.workOrderNumber,
          unitPrice: validated.unitPrice,
          eepu: validated.eepu,
          remark: validated.remark,
          department: validated.department,
        }
      });

      // 2. Update Generator current hours
      const generator = await tx.generator.findUnique({ where: { siteId: siteId } });
      if (generator) {
        await tx.generator.update({
          where: { siteId: siteId },
          data: { lastRunningHours: validated.endRunningHour }
        });
      }

      // 3. Update FuelRequest if requestId is provided
      if (validated.requestId) {
        await tx.fuelRequest.update({
          where: { id: parseInt(validated.requestId) },
          data: {
            status: "DELIVERED",
            actualRefueled: validated.actualRefueled
          }
        });
      }

      return refill;
    });

    revalidatePath("/dashboard/fuel-delivery")
    revalidatePath("/dashboard/fuel-journal")
    revalidatePath("/dashboard/analytical-report")
    revalidatePath("/dashboard/fuel-request")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return refill;
  } catch (err: any) {
    logger.error("createFuelDelivery failed", { error: err?.message })
    throw err;
  }
}

export interface FuelRequestData {
  siteId: string;
  priority?: string;
  literRequired?: number | string;
  technicianId?: string;
  remark?: string;
  runningHour?: number;
  securityName?: string;
  route?: string;
  driverName?: string;
  driverType?: string;
  driverPhone?: string;
  employeeId?: string;
}

const FuelRequestServerSchema = z.object({
  siteId: z.coerce.number().int().positive(),
  priority: z.string().optional(),
  literRequired: z.coerce.number().positive().optional().nullable(),
  technicianId: z.coerce.number().int().positive().optional().nullable(),
  remark: z.string().optional(),
  runningHour: z.coerce.number().optional().nullable(),
  securityName: z.string().optional(),
  route: z.string().optional(),
  driverName: z.string().optional(),
  driverType: z.string().optional(),
  driverPhone: z.string().optional(),
  employeeId: z.string().optional(),
})

export async function createFuelRequest(data: FuelRequestData) {
  await requireAbility("create", "FuelRequest")

  const parsed = FuelRequestServerSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid fuel request data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  // Create with a placeholder number, then derive the display number from
  // the row's own DB-assigned autoincrement id — atomic, no count() race.
  const request = await prisma.fuelRequest.create({
    data: {
      siteId: validated.siteId,
      status: "PENDING_SUPERVISOR",
      priority: validated.priority || "ROUTINE",
      literRequired: validated.literRequired ?? null,
      technicianId: validated.technicianId ?? null,
      notes: validated.remark || null,
      runningHour: validated.runningHour ?? null,
      securityName: validated.securityName || null,
      route: validated.route || null,
      driverName: validated.driverName || null,
      driverType: validated.driverType || null,
      driverPhone: validated.driverPhone || null,
      employeeId: validated.employeeId || null,
    }
  })
  const workRequestNumber = `REQ-${1000 + request.id}`
  const finalRequest = await prisma.fuelRequest.update({
    where: { id: request.id },
    data: { workRequestNumber },
  })

  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
  revalidatePath("/")
  return finalRequest
}

// Step 1: Supervisor approves → goes to Manager
export async function approveFuelRequest(id: number) {
  const { ability } = await requireAbility("update", "FuelRequest")
  const request = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
  if (!ability.can('update', subject('FuelRequest', request) as any)) {
    throw new AuthError('Forbidden', 403)
  }

  await prisma.fuelRequest.update({
    where: { id },
    data: { 
      status: "PENDING_MANAGER",
      approvedAt: new Date(),
    }
  })
  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
}

// Step 2: Manager approves → goes to Fleet Admin
export async function approveToFleetAdmin(id: number) {
  const { ability } = await requireAbility("update", "FuelRequest")
  const request = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
  if (!ability.can('update', subject('FuelRequest', request) as any)) {
    throw new AuthError('Forbidden', 403)
  }

  await prisma.fuelRequest.update({
    where: { id },
    data: { status: "PENDING_FLEET_ADMIN" }
  })
  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
}

// Step 3: Fleet Admin creates Work Order → goes to Finance
export async function createWorkOrder(id: number, data?: {
  planner?: string;
  assetNumber?: string;
  assetGroup?: string;
  wbAccountingClass?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  durationHrs?: number;
  workOrderType?: string;
  priority?: string;
  description?: string;
  department?: string;
  departmentDescription?: string;
  assetActivity?: string;
  firm?: string;
  status?: string;
}) {
  const { ability } = await requireAbility("update", "FuelRequest")
  const request = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
  if (!ability.can('update', subject('FuelRequest', request) as any)) {
    throw new AuthError('Forbidden', 403)
  }

  // Derived from the request's own (already unique) id — atomic, no
  // count()-based race or reuse on delete.
  const workOrderNumber = `WO-${1000 + id}`

  await prisma.fuelRequest.update({
    where: { id },
    data: {
      status: "PENDING_FUEL_SUPERVISOR",
      workOrderNumber,
      // Store WO form data in existing flexible fields
      route: data?.assetActivity || request.route,
      driverType: data?.workOrderType || request.driverType,
      securityName: data?.planner || request.securityName,
      notes: data?.description || request.notes,
      employeeId: data?.departmentDescription || request.employeeId,
    }
  })
  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
  return workOrderNumber
}

// Step 4: Fuel Supervisor approves Work Order → goes to Fleet Manager to forward
export async function approveWorkOrder(id: number) {
  const { ability } = await requireAbility("update", "FuelRequest")
  const request = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
  if (!ability.can('update', subject('FuelRequest', request) as any)) {
    throw new AuthError('Forbidden', 403)
  }

  await prisma.fuelRequest.update({
    where: { id },
    data: { status: "PENDING_FLEET_MANAGER_FORWARD" }
  })
  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
}

// Step 4.5: Fleet Manager forwards Work Order to F&L Country Manager
export async function forwardToFLManager(id: number) {
  const { ability } = await requireAbility("update", "FuelRequest")
  const request = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
  if (!ability.can('update', subject('FuelRequest', request) as any)) {
    throw new AuthError('Forbidden', 403)
  }

  await prisma.fuelRequest.update({
    where: { id },
    data: { status: "PENDING_FUND_RELEASE_FL_MANAGER" }
  })
  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
}

// Step 5: F&L Country Manager releases funds → to Fleet Manager
export async function releaseFundsToFleetManager(id: number, amount: number, remark: string) {
  try {
    const { ability } = await requireAbility("update", "FuelRequest")
    const requestRecord = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
    if (!ability.can('update', subject('FuelRequest', requestRecord) as any)) {
      throw new AuthError('Forbidden', 403)
    }

    await prisma.fuelRequest.update({
      where: { id },
      data: { 
        status: "FUNDS_RELEASED_TO_FLEET_MANAGER",
        financeRemark: remark
      }
    })

    // Log the transaction conceptually
    await prisma.transaction.create({
      data: {
        type: "FUND_RELEASE_TO_FM",
        paidAmount: amount,
        remark: remark || `Funds released for ${requestRecord.workOrderNumber}`,
        receiptNo: `FR-FL-${Date.now()}-${id}`,
        siteId: requestRecord.siteId,
        technicianId: requestRecord.technicianId,
        payerName: "F&L Country Manager",
      }
    })

    revalidatePath("/dashboard/fuel-request")
    revalidatePath("/dashboard")
  } catch (err: any) {
    logger.error("releaseFundsToFleetManager failed", { id, error: err?.message, stack: err?.stack });
    throw new Error(`Failed to release funds: ${err?.message}`);
  }
}

// Step 6: Fleet Manager releases funds → to Fleet Admin
export async function releaseFundsToFleetAdmin(id: number, amount: number, remark: string, adminUserId: string) {
  try {
    const { ability } = await requireAbility("update", "FuelRequest")
    const requestRecord = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
    if (!ability.can('update', subject('FuelRequest', requestRecord) as any)) {
      throw new AuthError('Forbidden', 403)
    }

    const request = await prisma.fuelRequest.update({
      where: { id },
      data: { 
        status: "FUNDS_RELEASED_TO_FLEET_ADMIN",
        financeRemark: remark
      }
    })

    // Update Fleet Admin's Wallet
    const wallet = await prisma.fuelAdminWallet.upsert({
      where: { userId: adminUserId },
      update: { balance: { increment: amount } },
      create: { userId: adminUserId, balance: amount }
    })

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount,
        fuelRequestId: id,
        description: `Funds released from Fleet Manager for Work Order ${request.workOrderNumber}`
      }
    })

    await prisma.transaction.create({
      data: {
        type: "FUND_RELEASE_TO_FA",
        paidAmount: amount,
        remark: remark || `Funds released to Fleet Admin for ${request.workOrderNumber}`,
        receiptNo: `FR-FM-${Date.now()}-${id}`,
        siteId: requestRecord.siteId,
        technicianId: requestRecord.technicianId,
        payerName: "Fleet Manager",
      }
    })

    revalidatePath("/dashboard/fuel-request")
    revalidatePath("/dashboard")
  } catch (err: any) {
    logger.error("releaseFundsToFleetAdmin failed", { id, error: err?.message, stack: err?.stack });
    throw new Error(`Failed to release funds: ${err?.message}`);
  }
}

export async function purchaseAndAssignFuel(id: number, adminUserId: string, technicianId: number, fuelStation: string, purchasedAmount: number) {
  const { ability } = await requireAbility("update", "FuelRequest")
  const requestRecord = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
  if (!ability.can('update', subject('FuelRequest', requestRecord) as any)) {
    throw new AuthError('Forbidden', 403)
  }

  const wallet = await prisma.fuelAdminWallet.findUnique({ where: { userId: adminUserId } })
  if (!wallet || wallet.balance < purchasedAmount) {
    throw new Error("Insufficient funds in Fuel Admin wallet")
  }

  // Deduct from wallet and update request in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.fuelAdminWallet.update({
      where: { userId: adminUserId },
      data: { balance: { decrement: purchasedAmount } }
    })

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "WITHDRAWAL",
        amount: purchasedAmount,
        fuelRequestId: id,
        fuelStation,
        description: `Fuel purchase for Work Order`
      }
    })

    await tx.fuelRequest.update({
      where: { id },
      data: { 
        status: "ASSIGNED_TO_TECH",
        technicianId,
        fuelStation,
        purchasedAmount
      }
    })
  })

  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
}

export async function verifyAndCompleteDelivery(id: number, remark?: string) {
  const { ability } = await requireAbility("update", "FuelRequest")
  const request = await prisma.fuelRequest.findUniqueOrThrow({ where: { id } })
  if (!ability.can('update', subject('FuelRequest', request) as any)) {
    throw new AuthError('Forbidden', 403)
  }

  await prisma.fuelRequest.update({
    where: { id },
    data: {
      status: "COMPLETED",
      ...(remark ? { financeRemark: remark } : {})
    }
  })
  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
}



export async function deleteFuelRequest(id: number) {
  await requireAbility("delete", "FuelRequest")

  await prisma.fuelRequest.delete({
    where: { id }
  })
  revalidatePath("/dashboard/fuel-request")
  revalidatePath("/dashboard")
}

export async function deleteFuelDelivery(id: number) {
  await requireAbility("delete", "FuelRefill")

  await prisma.fuelRefill.delete({
    where: { id }
  })
  revalidatePath("/dashboard/fuel-delivery")
  revalidatePath("/dashboard/fuel-journal")
  revalidatePath("/dashboard/analytical-report")
  revalidatePath("/dashboard")
  revalidatePath("/")
}

const UpdateFuelDeliveryServerSchema = z.object({
  siteId: z.coerce.number().int().positive().optional(),
  actualRefueled: z.coerce.number().positive().optional(),
  begRunningHour: z.coerce.number().nonnegative().optional(),
  endRunningHour: z.coerce.number().nonnegative().optional(),
  fuelBeforeRefuel: z.coerce.number().nonnegative().optional(),
  unitPrice: z.coerce.number().positive().optional(),
  driverName: z.string().optional(),
  driverId: z.string().optional(),
  technicianName: z.string().optional(),
  technicianId: z.string().optional(),
  employmentType: z.string().optional(),
  requestId: z.string().optional(),
  workOrderNumber: z.string().optional(),
})

export async function updateFuelDelivery(id: number, data: Partial<FuelDeliveryData>) {
  await requireAbility("update", "FuelRefill")

  const parsed = UpdateFuelDeliveryServerSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid fuel delivery update: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  if (
    validated.endRunningHour !== undefined &&
    validated.begRunningHour !== undefined &&
    validated.endRunningHour < validated.begRunningHour
  ) {
    throw new Error("End hours cannot be less than start hours")
  }

  const updatedRefill = await prisma.fuelRefill.update({
    where: { id },
    data: {
      ...(validated.actualRefueled !== undefined && { fuelDelivered: validated.actualRefueled }),
      ...(validated.fuelBeforeRefuel !== undefined && { beforeLevel: validated.fuelBeforeRefuel }),
      ...(validated.actualRefueled !== undefined && validated.fuelBeforeRefuel !== undefined && { afterLevel: validated.fuelBeforeRefuel + validated.actualRefueled }),
      ...(validated.begRunningHour !== undefined && { beforeHours: validated.begRunningHour }),
      ...(validated.endRunningHour !== undefined && { afterHours: validated.endRunningHour }),
      ...(validated.driverName !== undefined && { driverName: validated.driverName }),
      ...(validated.driverId !== undefined && { driverId: validated.driverId }),
      ...(validated.technicianName !== undefined && { technicianName: validated.technicianName }),
      ...(validated.technicianId !== undefined && { technicianIdStr: validated.technicianId }),
      ...(validated.employmentType !== undefined && { employmentType: validated.employmentType }),
      ...(validated.requestId !== undefined && { fuelRequestId: validated.requestId ? parseInt(validated.requestId) : null }),
      ...(validated.workOrderNumber !== undefined && { workOrderNumber: validated.workOrderNumber }),
      ...(validated.unitPrice !== undefined && { unitPrice: validated.unitPrice }),
    }
  });

  // Keep the generator's running-hours reading in sync. Derive siteId from
  // the persisted refill record — not the client payload — since the
  // server already knows the authoritative value and a client-supplied
  // siteId could point at a different generator than the refill it belongs to.
  if (validated.endRunningHour !== undefined) {
    const generator = await prisma.generator.findUnique({ where: { siteId: updatedRefill.siteId } });
    if (generator) {
      await prisma.generator.update({
        where: { siteId: updatedRefill.siteId },
        data: { lastRunningHours: validated.endRunningHour }
      });
    }
  }

  revalidatePath("/dashboard/fuel-delivery")
  revalidatePath("/dashboard/fuel-journal")
  revalidatePath("/dashboard/analytical-report")
  revalidatePath("/dashboard")
}
