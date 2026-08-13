export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";
import { apiErrorResponse } from "@/lib/server-utils";
import { z } from "zod";
import prisma from "@/lib/db";

const PatchSchema = z.object({
  role: z.enum(["ADMIN", "TECHNICIAN", "MANAGER", "SUPERVISOR", "FUEL_SUPERVISOR", "FLEET_MANAGER", "FL_COUNTRY_MANAGER", "FLEET_ADMIN", "GUEST"]).optional(),
  region: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"]);
    
    const { id } = await params;
    const body = await req.json();
    
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    
    const { role, region } = parsed.data;
    
    // Update Clerk publicMetadata
    const metadataUpdate: Record<string, any> = {};
    if (role !== undefined) metadataUpdate.role = role;
    if (region !== undefined) metadataUpdate.region = region;

    const client = await clerkClient();
    const updatedUser = await client.users.updateUserMetadata(id, {
      publicMetadata: metadataUpdate,
    });

    // Also sync region to the DB Technician record so onboarding check works correctly.
    // When admin assigns a region string (e.g. "CNR"), find the matching Region row and
    // update the Technician linked to this Clerk user.
    if (region !== undefined) {
      try {
        let regionId: number | null = null;
        if (region !== null && region !== "UNASSIGNED") {
          const regionRecord = await prisma.region.findFirst({
            where: { name: region },
          });
          if (regionRecord) regionId = regionRecord.id;
        }

        // Only update if a technician row exists for this userId
        await prisma.technician.updateMany({
          where: { userId: id },
          data: { regionId },
        });
      } catch {
        // Non-fatal: Technician record may not exist yet — that's fine
      }
    }
    
    return NextResponse.json({
      id: updatedUser.id,
      role: updatedUser.publicMetadata?.role,
      region: updatedUser.publicMetadata?.region,
    });
  } catch (error) {
    return apiErrorResponse(error, "PATCH /api/users/[id]");
  }
}
