import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSite, updateSite, deleteSite, getSites } from './actions'

// Mock auth and CASL
vi.mock('@/lib/auth', () => ({
  requireAbility: vi.fn().mockResolvedValue({ role: 'ADMIN' }),
  getRegionScope: vi.fn().mockResolvedValue(undefined)
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  default: {
    site: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn()
    },
    region: {
      findUnique: vi.fn()
    }
  }
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import prisma from '@/lib/db'
import { requireAbility } from '@/lib/auth'

describe('Sites Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createSite enforces CASL and creates a site', async () => {
    vi.mocked(prisma.site.create).mockResolvedValue({ id: 1, siteId: 'S-001', name: 'Test Site' } as any)
    
    const result = await createSite({
      siteId: 'S-001',
      name: 'Test Site',
      region: 'North',
      tankerCapacity: '5000'
    })

    expect(requireAbility).toHaveBeenCalledWith('create', 'Site')
    expect(prisma.site.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        siteId: 'S-001',
        name: 'Test Site',
        region: 'North',
        tankerCapacity: 5000
      })
    }))
    expect(result.id).toBe(1)
  })

  it('updateSite enforces CASL and updates a site', async () => {
    vi.mocked(prisma.site.update).mockResolvedValue({ id: 1, siteId: 'S-001', name: 'Updated Site' } as any)
    
    const result = await updateSite(1, {
      siteId: 'S-001',
      name: 'Updated Site',
      region: 'North',
      tankerCapacity: '6000'
    })

    expect(requireAbility).toHaveBeenCalledWith('update', 'Site')
    expect(prisma.site.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      data: expect.objectContaining({ name: 'Updated Site' })
    }))
    expect(result.name).toBe('Updated Site')
  })

  it('deleteSite enforces CASL and deletes a site', async () => {
    vi.mocked(prisma.site.delete).mockResolvedValue({ id: 1 } as any)
    
    const result = await deleteSite(1)

    expect(requireAbility).toHaveBeenCalledWith('delete', 'Site')
    expect(prisma.site.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    expect(result.success).toBe(true)
  })

  it('getSites enforces CASL and queries sites', async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: 1 }] as any)
    
    const result = await getSites()

    expect(requireAbility).toHaveBeenCalledWith('read', 'Site')
    expect(prisma.site.findMany).toHaveBeenCalled()
    expect(result).toHaveLength(1)
  })
})
