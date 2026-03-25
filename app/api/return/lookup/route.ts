import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import { getActiveTransactionsForStudent, getInventoryRecords } from "@/lib/google-sheets";
import { normalizeBarcode, normalizeEmail, normalizeStudentId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lookupSchema = z
  .object({
    studentId: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional()
  })
  .refine((value) => Boolean(value.studentId || value.email), {
    message: "Student ID or email is required."
  });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = lookupSchema.parse({
      studentId: searchParams.get("studentId") ?? undefined,
      email: searchParams.get("email") ?? undefined
    });

    const studentId = parsed.studentId ? normalizeStudentId(parsed.studentId) : undefined;
    const email = parsed.email ? normalizeEmail(parsed.email) : undefined;
    const [activeTransactions, inventory] = await Promise.all([
      getActiveTransactionsForStudent({ studentId, email }),
      getInventoryRecords()
    ]);

    const inventoryByBarcode = new Map(
      inventory.map((item) => [normalizeBarcode(item.barcode), item] as const)
    );
    const grouped = new Map<
      string,
      { barcode: string; name: string; borrowedCount: number }
    >();

    for (const row of activeTransactions) {
      const barcode = normalizeBarcode(row.barcode);
      const existing = grouped.get(barcode);

      if (existing) {
        existing.borrowedCount += 1;
        continue;
      }

      grouped.set(barcode, {
        barcode,
        name: inventoryByBarcode.get(barcode)?.name ?? "Unknown item",
        borrowedCount: 1
      });
    }

    return NextResponse.json({
      studentId: activeTransactions[0]?.studentId ?? studentId ?? "",
      email: activeTransactions[0]?.email ?? email ?? "",
      items: Array.from(grouped.values()).sort((left, right) =>
        left.name.localeCompare(right.name)
      )
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
