export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";
import { apiErrorResponse } from "@/lib/server-utils";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    
    const client = await clerkClient();
    const response = await client.users.getUserList({
      limit: 100,
    });
    
    const users = response.data.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.emailAddresses[0]?.emailAddress ?? "",
      role: u.publicMetadata?.role ?? "GUEST",
      region: u.publicMetadata?.region ?? null,
    }));
    
    return NextResponse.json(users);
  } catch (error) {
    return apiErrorResponse(error, "GET /api/users");
  }
}
