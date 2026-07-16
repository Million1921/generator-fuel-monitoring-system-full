export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Admin setup is disabled" }, { status: 404 });
}
