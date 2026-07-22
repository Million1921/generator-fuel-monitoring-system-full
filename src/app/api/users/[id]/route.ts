export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";
import { apiErrorResponse } from "@/lib/server-utils";
import { z } from "zod";

const PatchSchema = z.object({
  role: z.enum(["ADMIN", "TECHNICIAN", "MANAGER", "SUPERVISOR", "FINANCE", "FLEET_ADMIN", "GUEST"]).optional(),
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
    
    // We only update the publicMetadata fields provided
    const metadataUpdate: Record<string, any> = {};
    if (role !== undefined) metadataUpdate.role = role;
    if (region !== undefined) metadataUpdate.region = region;

    const client = await clerkClient();
    const updatedUser = await client.users.updateUserMetadata(id, {
      publicMetadata: metadataUpdate,
    });
    
    return NextResponse.json({
      id: updatedUser.id,
      role: updatedUser.publicMetadata?.role,
      region: updatedUser.publicMetadata?.region,
    });
  } catch (error) {
    return apiErrorResponse(error, "PATCH /api/users/[id]");
  }
}
