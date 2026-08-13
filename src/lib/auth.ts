import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { defineAbilitiesFor, Actions, Subjects } from "./ability";

export type AppRole = "ADMIN" | "TECHNICIAN" | "MANAGER" | "SUPERVISOR" | "FUEL_SUPERVISOR" | "FLEET_MANAGER" | "FL_COUNTRY_MANAGER" | "FLEET_ADMIN" | "GUEST";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function getRoleFromClerk(): Promise<AppRole> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new AuthError("Unauthorized", 401);
  }

  const claims = sessionClaims as Record<string, any> | null;
  const role =
    claims?.metadata?.role ??
    claims?.publicMetadata?.role ??
    claims?.role ??
    (await currentUser())?.publicMetadata?.role;

  if (typeof role !== "string") {
    // Fail closed: a signed-in user with no role claim gets the
    // no-privilege "GUEST" role (read-only floor defined in ability.ts),
    // never a writing role. Log it so misconfigured accounts surface early.
    console.warn(`[auth] Signed-in user ${userId} has no role claim; defaulting to GUEST`);
    return "GUEST";
  }

  const normalizedRole = role.toUpperCase().replace(/\s+/g, '_');
  return normalizedRole as AppRole;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const role = await getRoleFromClerk();

  if (!allowedRoles.includes(role)) {
    throw new AuthError("Forbidden", 403);
  }

  return role;
}

export async function getRegionScope(role: AppRole): Promise<string | undefined> {
  if (["ADMIN", "FL_COUNTRY_MANAGER", "FLEET_MANAGER", "FUEL_SUPERVISOR"].includes(role)) {
    return undefined; // All regions access
  }
  
  const { sessionClaims } = await auth();
  const claims = sessionClaims as Record<string, any> | null;
  const region =
    claims?.metadata?.region ??
    claims?.publicMetadata?.region ??
    claims?.region ??
    (await currentUser())?.publicMetadata?.region;

  // If a restricted role (like MANAGER) has no region claim, default to 'UNASSIGNED' 
  // so they don't accidentally get global access.
  return typeof region === "string" ? region : "UNASSIGNED";
}

export async function requireAbility(action: Actions, subject: Subjects) {
  const role = await getRoleFromClerk();
  const ability = defineAbilitiesFor(role);

  if (!ability.can(action, subject)) {
    throw new AuthError("Forbidden", 403);
  }

  const { userId } = await auth();

  return { role, ability, session: { user: { id: userId! } } };
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
}
