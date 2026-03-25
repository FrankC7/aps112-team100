import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, handleRouteError } from "@/lib/api";
import { sendReturnReceipt } from "@/lib/email";
import {
  getActiveTransactionsForStudent,
  getInventoryRecords,
  finalizeReturnTransactions
} from "@/lib/google-sheets";
import { normalizeBarcode, normalizeEmail, normalizeStudentId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const returnSchema = z
  .object({
    studentId: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    items: z
      .array(
        z.object({
          barcode: z.string().trim().min(1, "Barcode is required."),
          quantity: z.number().int().min(1).max(25)
        })
      )
      .min(1, "At least one scanned item must be returned.")
  })
  .refine((value) => Boolean(value.studentId || value.email), {
    message: "Student ID or email is required."
  });

export async function POST(request: Request) {
  try {
    const payload = returnSchema.parse(await request.json());
    const studentId = payload.studentId ? normalizeStudentId(payload.studentId) : undefined;
    const email = payload.email ? normalizeEmail(payload.email) : undefined;
    const activeTransactions = await getActiveTransactionsForStudent({ studentId, email });

    if (activeTransactions.length === 0) {
      throw new AppError("No active borrowed items were found for this student.", 404);
    }

    const inventory = await getInventoryRecords();
    const inventoryByBarcode = new Map(
      inventory.map((item) => [normalizeBarcode(item.barcode), item] as const)
    );
    const activeCountByBarcode = new Map<string, number>();

    for (const row of activeTransactions) {
      const barcode = normalizeBarcode(row.barcode);
      activeCountByBarcode.set(barcode, (activeCountByBarcode.get(barcode) ?? 0) + 1);
    }
    const mergedItems = new Map<string, number>();

    for (const entry of payload.items) {
      const barcode = normalizeBarcode(entry.barcode);
      mergedItems.set(barcode, (mergedItems.get(barcode) ?? 0) + entry.quantity);
    }

    const items = Array.from(mergedItems.entries()).map(([barcode, quantity]) => {
      const borrowedCount = activeCountByBarcode.get(barcode) ?? 0;
      const item = inventoryByBarcode.get(barcode);

      if (borrowedCount < quantity) {
        throw new AppError(
          `This student only has ${borrowedCount} active unit(s) for barcode ${barcode}.`,
          409
        );
      }

      return {
        barcode,
        quantity,
        name: item?.name ?? "Unknown item"
      };
    });

    const returnedAt = new Date().toISOString();

    await finalizeReturnTransactions(
      {
        studentId,
        email
      },
      items.map((item) => ({
        barcode: item.barcode,
        quantity: item.quantity
      })),
      returnedAt
    );

    const resolvedStudentId = activeTransactions[0].studentId;
    const resolvedEmail = activeTransactions[0].email;
    let emailSent = true;

    try {
      await sendReturnReceipt({
        studentId: resolvedStudentId,
        email: resolvedEmail,
        returnedAt,
        items
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Return receipt email failed.", emailError);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      returnedAt
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
