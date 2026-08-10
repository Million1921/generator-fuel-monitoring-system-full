import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { AppRole } from './auth';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subjects = 'Site' | 'Generator' | 'Technician' | 'FuelRequest' | 'FuelRefill' | 'Transaction' | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilitiesFor(role: AppRole): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case 'ADMIN':
    case 'MANAGER':
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
      // Manager reviews requests after the supervisor and approves them to the admin (Finance)
      can('update', 'FuelRequest', {
        status: { $in: ['PENDING_MANAGER_APPROVAL'] }
      } as any);
      can('update', 'FuelRefill');
      cannot('create', 'FuelRequest');
      cannot('delete', 'all');
      break;

    case 'FLEET_ADMIN':
      // Fleet Department: only responsible for issuing the Work Order once a
      // fuel request has cleared Supervisor -> Manager -> Admin approval.
      // Cannot approve/reject fuel requests or create new ones.
      can('read', 'FuelRequest');
      can('read', 'Site');
      can('read', 'Generator');
      // FLEET_ADMIN updates are constrained to specific statuses in the lifecycle.
      // They can only act on requests that have been approved or are in progress.
      can('update', 'FuelRequest', {
        status: { $in: ['APPROVED_REQUEST', 'PENDING_MANAGER_APPROVAL', 'FUNDS_RELEASED', 'ASSIGNED_TO_TECH'] }
      } as any);
      cannot('create', 'FuelRequest');
      cannot('delete', 'all');
      break;

    case 'FINANCE':
      can('read', 'all');
      can('manage', 'Transaction');
      cannot('create', 'Site');
      cannot('create', 'Generator');
      cannot('create', 'Technician');
      cannot('create', 'FuelRequest');
      cannot('create', 'FuelRefill');
      break;

    default:
      // Fallback for anonymous or unassigned users: read-only general access
      can('read', 'Site');
      can('read', 'Generator');
      break;
  }

  return build();
}
