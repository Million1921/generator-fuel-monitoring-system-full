import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { AppRole } from './auth';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subjects = 'Site' | 'Generator' | 'Technician' | 'FuelRequest' | 'FuelRefill' | 'Transaction' | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilitiesFor(role: AppRole): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case 'ADMIN':
      can('manage', 'all');
      break;

    case 'SUPERVISOR':
      can('read', 'all');
      can('create', 'FuelRequest');
      can('update', 'FuelRequest');
      can('create', 'FuelRefill');
      can('update', 'FuelRefill');
      cannot('delete', 'all');
      break;

    case 'TECHNICIAN':
      can('read', 'Site');
      can('read', 'Generator');
      can('read', 'Technician');
      can('read', 'FuelRequest');
      can('read', 'FuelRefill');
      can('create', 'FuelRequest');
      can('create', 'FuelRefill');
      cannot('update', 'all');
      cannot('delete', 'all');
      break;

    case 'MANAGER':
      can('read', 'all');
      can('update', 'FuelRequest', {
        status: { $in: ['PENDING_MANAGER'] }
      } as any);
      can('update', 'FuelRefill');
      cannot('create', 'FuelRequest');
      cannot('delete', 'all');
      break;

    case 'FLEET_ADMIN':
      can('read', 'FuelRequest');
      can('read', 'Site');
      can('read', 'Generator');
      can('update', 'FuelRequest', {
        status: { $in: ['PENDING_FLEET_ADMIN', 'FUNDS_RELEASED_TO_FLEET_ADMIN', 'ASSIGNED_TO_TECH'] }
      } as any);
      cannot('create', 'FuelRequest');
      cannot('delete', 'all');
      break;

    case 'FUEL_SUPERVISOR':
      can('read', 'all');
      can('update', 'FuelRequest', {
        status: { $in: ['PENDING_FUEL_SUPERVISOR'] }
      } as any);
      break;

    case 'FLEET_MANAGER':
      can('read', 'all');
      can('update', 'FuelRequest', {
        status: { $in: ['FUNDS_RELEASED_TO_FLEET_MANAGER'] }
      } as any);
      break;

    case 'FL_COUNTRY_MANAGER':
      can('read', 'all');
      can('update', 'FuelRequest', {
        status: { $in: ['PENDING_FUND_RELEASE_FL_MANAGER'] }
      } as any);
      break;

    default:
      can('read', 'Site');
      can('read', 'Generator');
      break;
  }

  return build();
}
