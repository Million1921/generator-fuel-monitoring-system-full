import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createFuelRequest, 
  approveFuelRequest,
  createWorkOrder,
  approveWorkOrder,
  releaseFundsToFleetManager,
  releaseFundsToFleetAdmin,
  purchaseAndAssignFuel,
  verifyAndCompleteDelivery
} from './actions'

// Mock dependencies
vi.mock('@/lib/db', () => {
  return {
    default: {
      fuelRequest: {
        create: vi.fn(),
        update: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findUnique: vi.fn()
      },
      fuelAdminWallet: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      },
      walletTransaction: {
        create: vi.fn()
      },
      $transaction: vi.fn((cb) => cb({
        fuelAdminWallet: { update: vi.fn() },
        walletTransaction: { create: vi.fn() },
        fuelRequest: { update: vi.fn() }
      }))
    }
  }
})

vi.mock('@/lib/auth', () => {
  return {
    requireAbility: vi.fn().mockResolvedValue({
      ability: {
        can: vi.fn().mockReturnValue(true)
      },
      session: { user: { id: 'test-admin' } }
    }),
    AuthError: class AuthError extends Error {}
  }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import prisma from '@/lib/db'
import { requireAbility } from '@/lib/auth'

describe('Fuel Request Workflow State Machine', () => {
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createFuelRequest initializes with PENDING_SUPERVISOR', async () => {
    const mockRequest = { id: 1 }
    // @ts-ignore
    prisma.fuelRequest.create.mockResolvedValue(mockRequest)
    // @ts-ignore
    prisma.fuelRequest.update.mockResolvedValue({ ...mockRequest, workRequestNumber: 'REQ-1001' })

    const result = await createFuelRequest({
      siteId: '10',
      priority: 'HIGH',
      literRequired: 500
    })

    expect(prisma.fuelRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        siteId: 10,
        status: 'PENDING_SUPERVISOR',
        priority: 'HIGH',
        literRequired: 500
      })
    })
    
    expect(prisma.fuelRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { workRequestNumber: 'REQ-1001' }
    })
    
    expect(result.workRequestNumber).toBe('REQ-1001')
  })

  it('approveFuelRequest transitions to PENDING_MANAGER', async () => {
    const mockRecord = { id: 1, status: 'PENDING_SUPERVISOR' }
    // @ts-ignore
    prisma.fuelRequest.findUniqueOrThrow.mockResolvedValue(mockRecord)
    
    await approveFuelRequest(1)
    
    expect(requireAbility).toHaveBeenCalledWith('update', 'FuelRequest')
    expect(prisma.fuelRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        status: 'PENDING_MANAGER',
      })
    })
  })

  it('approveToFleetAdmin (manager) transitions to PENDING_FLEET_ADMIN', async () => {
    const mockRecord = { id: 1, status: 'PENDING_MANAGER' }
    // @ts-ignore
    prisma.fuelRequest.findUniqueOrThrow.mockResolvedValue(mockRecord)
    
    await approveToFleetAdmin(1)
    
    expect(prisma.fuelRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'PENDING_FLEET_ADMIN' }
    })
  })

  it('createWorkOrder (fleet admin) transitions to PENDING_FUEL_SUPERVISOR', async () => {
    const mockRecord = { id: 1, status: 'PENDING_FLEET_ADMIN' }
    // @ts-ignore
    prisma.fuelRequest.findUniqueOrThrow.mockResolvedValue(mockRecord)
    
    await createWorkOrder(1)
    
    expect(prisma.fuelRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { 
        status: 'PENDING_FUEL_SUPERVISOR',
        workOrderNumber: 'WO-1001'
      }
    })
  })

  it('releaseFunds handles wallet logic and transitions to FUNDS_RELEASED', async () => {
    const mockRecord = { id: 1, status: 'PENDING_FUEL_SUPERVISOR', workOrderNumber: 'WO-1001' }
    // @ts-ignore
    prisma.fuelRequest.findUniqueOrThrow.mockResolvedValue(mockRecord)
    
    // @ts-ignore
    prisma.fuelAdminWallet.upsert.mockResolvedValue({ id: 99, balance: 5000 })
    // @ts-ignore
    prisma.fuelRequest.update.mockResolvedValue(mockRecord)
    
    await releaseFundsToFleetAdmin(1, 10000, 'Approved deposit', 'admin-123')
    
    expect(prisma.fuelRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'FUNDS_RELEASED_TO_FLEET_ADMIN', financeRemark: 'Approved deposit' }
    })
    
    expect(prisma.fuelAdminWallet.upsert).toHaveBeenCalledWith({
      where: { userId: 'admin-123' },
      update: { balance: { increment: 5000 } },
      create: { userId: 'admin-123', balance: 5000 }
    })
    
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: {
        walletId: 99,
        type: 'DEPOSIT',
        amount: 5000,
        fuelRequestId: 1,
        description: 'Funds released for Work Order WO-1001'
      }
    })
  })

  it('purchaseAndAssignFuel enforces wallet balance before updating', async () => {
    const mockRecord = { id: 1, status: 'FUNDS_RELEASED_TO_FLEET_ADMIN' }
    // @ts-ignore
    prisma.fuelRequest.findUniqueOrThrow.mockResolvedValue(mockRecord)
    
    // Wallet has insufficient funds
    // @ts-ignore
    prisma.fuelAdminWallet.findUnique.mockResolvedValue({ id: 99, balance: 100 })
    
    await expect(purchaseAndAssignFuel(1, 'admin-123', 5, 'Station A', 1000))
      .rejects.toThrow('Insufficient funds in Fuel Admin wallet')
      
    // @ts-ignore
    prisma.fuelAdminWallet.findUnique.mockResolvedValue({ id: 99, balance: 5000 })
    
    // Test transaction call logic
    // We mock $transaction to call our callback with mock Tx object
    const mockTx = {
      fuelAdminWallet: { update: vi.fn() },
      walletTransaction: { create: vi.fn() },
      fuelRequest: { update: vi.fn() }
    }
    // @ts-ignore
    prisma.$transaction.mockImplementationOnce(async (cb) => {
      await cb(mockTx)
    })
    
    await purchaseAndAssignFuel(1, 'admin-123', 5, 'Station A', 1000)
    
    expect(mockTx.fuelAdminWallet.update).toHaveBeenCalledWith({
      where: { userId: 'admin-123' },
      data: { balance: { decrement: 1000 } }
    })
    expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'WITHDRAWAL',
        amount: 1000,
        fuelStation: 'Station A',
        fuelRequestId: 1
      })
    })
    expect(mockTx.fuelRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'ASSIGNED_TO_TECH',
        technicianId: 5,
        fuelStation: 'Station A',
        purchasedAmount: 1000
      }
    })
  })
})
