import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { AuthError } from "./auth";

/**
 * Minimal structured logger. Replaces bare `console.error(err)` calls with
 * a consistent shape (level, timestamp, correlation id) that can later be
 * wired to a real observability sink (Vercel logs, Sentry, etc.) without
 * touching call sites again.
 */
export const logger = {
  error(message: string, meta: Record<string, unknown> = {}) {
    console.error(JSON.stringify({ level: "error", timestamp: new Date().toISOString(), message, ...meta }));
  },
  warn(message: string, meta: Record<string, unknown> = {}) {
    console.warn(JSON.stringify({ level: "warn", timestamp: new Date().toISOString(), message, ...meta }));
  },
};

/**
 * Known Prisma error codes we want to map to intentional client-safe
 * responses instead of a generic 500.
 */
function mapPrismaError(e: any): { status: number; message: string } | null {
  if (e && typeof e.code === "string") {
    if (e.code === "P2002") return { status: 409, message: "A record with this value already exists" };
    if (e.code === "P2025") return { status: 404, message: "Record not found" };
    if (e.code === "P2003") return { status: 400, message: "Related record not found" };
  }
  return null;
}

/**
 * Standard API error handler for route handlers. Never leaks `e.message`
 * (which can contain schema/constraint/connection details) to the client;
 * logs full detail server-side with a correlation id instead.
 */
export function apiErrorResponse(e: unknown, context: string) {
  if (e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const correlationId = randomUUID();
  const prismaMapped = mapPrismaError(e);

  logger.error(context, {
    correlationId,
    error: e instanceof Error ? e.message : String(e),
    stack: e instanceof Error ? e.stack : undefined,
  });

  if (prismaMapped) {
    return NextResponse.json({ error: prismaMapped.message, correlationId }, { status: prismaMapped.status });
  }

  return NextResponse.json({ error: "Internal server error", correlationId }, { status: 500 });
}

/**
 * Generates a collision-safe sequential display number (e.g. "REQ-1042")
 * from a row's own DB-assigned autoincrement id, instead of a racy
 * `count()` snapshot. The row must already exist (created with a
 * placeholder/null value for the field being set) before calling this.
 */
export function displayNumberFromId(prefix: string, id: number, base = 1000) {
  return `${prefix}-${base + id}`;
}
