import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGenerator, updateGenerator, deleteGenerator, getGenerators } from './actions'

// Mock auth and CASL
vi.mock('@/lib/auth', () => ({
  requireAbility: vi.fn().mockResolvedValue({ role: 'ADMIN' }),
  getRegionScope: vi.fn().mockResolvedValue(undefined)
}))

// Mock Prisma
vi.mock('@/lib/db', () => {
  const mockGeneratorDb = {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn()
  }
  return {
    default: {
      $transaction: vi.fn().mockImplementation((cb) => cb({ generator: mockGeneratorDb })),
      generator: mockGeneratorDb,
      site: {
        findUnique: vi.fn().mockResolvedValue({ id: 1, region: 'North' })
      }
    }
  }
})

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import prisma from '@/lib/db'
import { requireAbility } from '@/lib/auth'

describe('Generators Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createGenerator enforces CASL and creates a generator', async () => {
    vi.mocked(prisma.generator.create).mockResolvedValue({ id: 1, siteId: 1, model: 'GEN-M' } as any)
    vi.mocked(prisma.generator.update).mockResolvedValue({ id: 1, siteId: 1, model: 'GEN-M', genId: 'GEN-1-1' } as any)
    
    const result = await createGenerator({
      siteId: '1',
      model: 'GEN-M',
      serialNumber: 'SN-001',
      capacityKVA: '500',
      stdFuelConsumption: '10',
      lastRunningHours: '100'
    })

    expect(requireAbility).toHaveBeenCalledWith('create', 'Generator')
    expect(prisma.generator.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ model: 'GEN-M' })
    }))
    expect(result.id).toBe(1)
  })

  it('updateGenerator enforces CASL and updates a generator', async () => {
    vi.mocked(prisma.generator.update).mockResolvedValue({ id: 1, model: 'GEN-NEW' } as any)
    
    const result = await updateGenerator(1, {
      model: 'GEN-NEW'
    })

    expect(requireAbility).toHaveBeenCalledWith('update', 'Generator')
    expect(prisma.generator.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      data: expect.objectContaining({ model: 'GEN-NEW' })
    }))
    expect(result.model).toBe('GEN-NEW')
  })

  it('deleteGenerator enforces CASL and deletes a generator', async () => {
    vi.mocked(prisma.generator.delete).mockResolvedValue({ id: 1 } as any)
    
    const result = await deleteGenerator(1)

    expect(requireAbility).toHaveBeenCalledWith('delete', 'Generator')
    expect(prisma.generator.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    expect(result.success).toBe(true)
  })
})
