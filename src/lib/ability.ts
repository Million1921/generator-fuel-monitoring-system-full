import { AbilityBuilder, PureAbility, AbilityClass } from '@casl/ability';
import { AppRole } from './auth';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subjects = 'Site' | 'Generator' | 'Technician' | 'FuelRequest' | 'FuelRefill' | 'Transaction' | 'all';

export type AppAbility = PureAbility<[Actions, Subjects]>;
export const AppAbility = PureAbility as AbilityClass<AppAbility>;

export function defineAbilitiesFor(role: AppRole): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(AppAbility);

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

    case 'FLEET_ADMIN':
      // Fleet Department: only responsible for issuing the Work Order once a
      // fuel request has cleared Supervisor -> Manager -> Admin approval.
      // Cannot approve/reject fuel requests or create new ones.
      can('read', 'FuelRequest');
      can('read', 'Site');
      can('read', 'Generator');
      // WARNING: Do not rely solely on requireAbility('update', 'FuelRequest') for general
      // updates. FLEET_ADMIN should only perform update through createWorkOrder. The actions
      // verify the specific role constraint directly.
      can('update', 'FuelRequest');
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
