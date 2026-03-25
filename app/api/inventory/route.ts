import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { getInventoryRecords } from "@/lib/google-sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const inventory = await getInventoryRecords();
    return NextResponse.json({ items: inventory });
  } catch (error) {
    return handleRouteError(error);
  }
}

