import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, handleRouteError } from "@/lib/api";
import { sendBorrowReceipt } from "@/lib/email";
import {
  appendBorrowTransactions,
  getInventoryRecords,
  updateInventoryAvailability
} from "@/lib/google-sheets";
import { normalizeBarcode, normalizeEmail, normalizeStudentId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const borrowSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required."),
  email: z.string().trim().email("A valid student email is required."),
  items: z
    .array(
      z.object({
        barcode: z.string().trim().min(1, "Barcode is required."),
        quantity: z.number().int().min(1).max(25)
      })
    )
    .min(1, "At least one scanned item is required.")
});

export async function POST(request: Request) {
  try {
    const payload = borrowSchema.parse(await request.json());
    const studentId = normalizeStudentId(payload.studentId);
    const email = normalizeEmail(payload.email);
    const inventory = await getInventoryRecords();
    const inventoryByBarcode = new Map(
      inventory.map((item) => [normalizeBarcode(item.barcode), item] as const)
    );
    const mergedItems = new Map<string, number>();

    for (const entry of payload.items) {
      const barcode = normalizeBarcode(entry.barcode);
      mergedItems.set(barcode, (mergedItems.get(barcode) ?? 0) + entry.quantity);
    }

    const cart = Array.from(mergedItems.entries()).map(([barcode, quantity]) => {
      const item = inventoryByBarcode.get(barcode);

      if (!item) {
        throw new AppError(`Item barcode ${barcode} does not exist in inventory.`, 404);
      }

      if (item.available < quantity) {
        throw new AppError(
          `${item.name} only has ${item.available} unit(s) available right now.`,
          409
        );
      }

      return {
        ...item,
        barcode,
        quantity
      };
    });

    const borrowedAt = new Date().toISOString();

    await updateInventoryAvailability(
      cart.map((item) => ({
        barcode: item.barcode,
        delta: -item.quantity
      }))
    );

    await appendBorrowTransactions({
      studentId,
      email,
      items: cart.map((item) => ({
        barcode: item.barcode,
        quantity: item.quantity
      })),
      borrowedAt
    });

    let emailSent = true;

    try {
      await sendBorrowReceipt({
        studentId,
        email,
        borrowedAt,
        items: cart.map((item) => ({
          name: item.name,
          barcode: item.barcode,
          quantity: item.quantity
        }))
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Borrow receipt email failed.", emailError);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      borrowedAt
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
