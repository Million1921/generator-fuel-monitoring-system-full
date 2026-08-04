import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTechnician, updateTechnician, deleteTechnician, getTechnicians } from './actions'

// Mock auth and CASL
vi.mock('@/lib/auth', () => ({
  requireAbility: vi.fn().mockResolvedValue({ role: 'ADMIN' }),
  getRegionScope: vi.fn().mockResolvedValue(undefined)
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  default: {
    technician: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import prisma from '@/lib/db'
import { requireAbility } from '@/lib/auth'

describe('Technicians Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createTechnician enforces CASL and creates a technician', async () => {
    vi.mocked(prisma.technician.create).mockResolvedValue({ id: 1, name: 'John Doe', phone: '123' } as any)
    
    const result = await createTechnician({
      name: 'John Doe',
      phone: '123'
    })

    expect(requireAbility).toHaveBeenCalledWith('create', 'Technician')
    expect(prisma.technician.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: 'John Doe' })
    }))
    expect(result.id).toBe(1)
  })

  it('updateTechnician enforces CASL and updates a technician', async () => {
    vi.mocked(prisma.technician.update).mockResolvedValue({ id: 1, name: 'Jane Doe' } as any)
    
    const result = await updateTechnician(1, {
      name: 'Jane Doe',
      phone: '456',
      status: 'ACTIVE'
    })

    expect(requireAbility).toHaveBeenCalledWith('update', 'Technician')
    expect(prisma.technician.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      data: expect.objectContaining({ name: 'Jane Doe' })
    }))
    expect(result.name).toBe('Jane Doe')
  })

  it('deleteTechnician enforces CASL and deletes a technician', async () => {
    vi.mocked(prisma.technician.delete).mockResolvedValue({ id: 1 } as any)
    
    const result = await deleteTechnician(1)

    expect(requireAbility).toHaveBeenCalledWith('delete', 'Technician')
    expect(prisma.technician.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    expect(result.success).toBe(true)
  })

  it('getTechnicians enforces CASL and queries technicians', async () => {
    vi.mocked(prisma.technician.findMany).mockResolvedValue([{ id: 1 }] as any)
    vi.mocked(prisma.technician.count).mockResolvedValue(1)
    
    const result = await getTechnicians()

    expect(requireAbility).toHaveBeenCalledWith('read', 'Technician')
    expect(prisma.technician.findMany).toHaveBeenCalled()
    expect(result.technicians).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})
