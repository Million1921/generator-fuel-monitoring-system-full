import { describe, it, expect } from 'vitest'
import { defineAbilitiesFor } from './ability'

describe('CASL Ability Definitions', () => {

  // ── ADMIN ─────────────────────────────────────────────────────────────

  describe('ADMIN role', () => {
    const ability = defineAbilitiesFor('ADMIN')

    it('can manage everything', () => {
      expect(ability.can('manage', 'all')).toBe(true)
      expect(ability.can('create', 'Site')).toBe(true)
      expect(ability.can('delete', 'FuelRequest')).toBe(true)
      expect(ability.can('update', 'Generator')).toBe(true)
    })
  })

  // ── MANAGER ───────────────────────────────────────────────────────────

  describe('MANAGER role', () => {
    const ability = defineAbilitiesFor('MANAGER')

    it('can manage everything', () => {
      expect(ability.can('manage', 'all')).toBe(true)
    })
  })

  // ── SUPERVISOR ────────────────────────────────────────────────────────

  describe('SUPERVISOR role', () => {
    const ability = defineAbilitiesFor('SUPERVISOR')

    it('can read everything', () => {
      expect(ability.can('read', 'Site')).toBe(true)
      expect(ability.can('read', 'Generator')).toBe(true)
      expect(ability.can('read', 'FuelRequest')).toBe(true)
    })

    it('can create and update fuel requests and refills', () => {
      expect(ability.can('create', 'FuelRequest')).toBe(true)
      expect(ability.can('update', 'FuelRequest')).toBe(true)
      expect(ability.can('create', 'FuelRefill')).toBe(true)
      expect(ability.can('update', 'FuelRefill')).toBe(true)
    })

    it('cannot delete anything', () => {
      expect(ability.can('delete', 'Site')).toBe(false)
      expect(ability.can('delete', 'FuelRequest')).toBe(false)
      expect(ability.can('delete', 'Generator')).toBe(false)
    })

    it('cannot create sites, generators, or technicians', () => {
      expect(ability.can('create', 'Site')).toBe(false)
      expect(ability.can('create', 'Generator')).toBe(false)
      expect(ability.can('create', 'Technician')).toBe(false)
    })
  })

  // ── TECHNICIAN ────────────────────────────────────────────────────────

  describe('TECHNICIAN role', () => {
    const ability = defineAbilitiesFor('TECHNICIAN')

    it('can read sites, generators, technicians, fuel requests, and refills', () => {
      expect(ability.can('read', 'Site')).toBe(true)
      expect(ability.can('read', 'Generator')).toBe(true)
      expect(ability.can('read', 'Technician')).toBe(true)
      expect(ability.can('read', 'FuelRequest')).toBe(true)
      expect(ability.can('read', 'FuelRefill')).toBe(true)
    })

    it('can create fuel requests and refills', () => {
      expect(ability.can('create', 'FuelRequest')).toBe(true)
      expect(ability.can('create', 'FuelRefill')).toBe(true)
    })

    it('cannot update or delete anything', () => {
      expect(ability.can('update', 'FuelRequest')).toBe(false)
      expect(ability.can('delete', 'FuelRequest')).toBe(false)
      expect(ability.can('update', 'Site')).toBe(false)
    })
  })

  // ── FLEET_ADMIN ───────────────────────────────────────────────────────

  describe('FLEET_ADMIN role', () => {
    const ability = defineAbilitiesFor('FLEET_ADMIN')

    it('can read fuel requests, sites, and generators', () => {
      expect(ability.can('read', 'FuelRequest')).toBe(true)
      expect(ability.can('read', 'Site')).toBe(true)
      expect(ability.can('read', 'Generator')).toBe(true)
    })

    it('cannot create fuel requests', () => {
      expect(ability.can('create', 'FuelRequest')).toBe(false)
    })

    it('cannot delete anything', () => {
      expect(ability.can('delete', 'FuelRequest')).toBe(false)
      expect(ability.can('delete', 'Site')).toBe(false)
    })

    it('cannot read technicians or refills (not explicitly granted)', () => {
      expect(ability.can('read', 'Technician')).toBe(false)
      expect(ability.can('read', 'FuelRefill')).toBe(false)
    })
  })

  // ── FINANCE ───────────────────────────────────────────────────────────

  describe('FINANCE role', () => {
    const ability = defineAbilitiesFor('FINANCE')

    it('can read everything', () => {
      expect(ability.can('read', 'Site')).toBe(true)
      expect(ability.can('read', 'Generator')).toBe(true)
      expect(ability.can('read', 'FuelRequest')).toBe(true)
    })

    it('can manage transactions', () => {
      expect(ability.can('manage', 'Transaction')).toBe(true)
    })

    it('cannot create operational resources', () => {
      expect(ability.can('create', 'Site')).toBe(false)
      expect(ability.can('create', 'Generator')).toBe(false)
      expect(ability.can('create', 'Technician')).toBe(false)
      expect(ability.can('create', 'FuelRequest')).toBe(false)
      expect(ability.can('create', 'FuelRefill')).toBe(false)
    })
  })

  // ── GUEST / default ───────────────────────────────────────────────────

  describe('GUEST role (default)', () => {
    const ability = defineAbilitiesFor('GUEST')

    it('can read sites and generators only', () => {
      expect(ability.can('read', 'Site')).toBe(true)
      expect(ability.can('read', 'Generator')).toBe(true)
    })

    it('cannot read fuel requests, refills, or technicians', () => {
      expect(ability.can('read', 'FuelRequest')).toBe(false)
      expect(ability.can('read', 'FuelRefill')).toBe(false)
      expect(ability.can('read', 'Technician')).toBe(false)
    })

    it('cannot create, update, or delete anything', () => {
      expect(ability.can('create', 'Site')).toBe(false)
      expect(ability.can('update', 'Site')).toBe(false)
      expect(ability.can('delete', 'Site')).toBe(false)
      expect(ability.can('create', 'FuelRequest')).toBe(false)
    })
  })
})
