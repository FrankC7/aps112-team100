"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ScanLine, ShoppingCart } from "lucide-react";
import { ScannedItemCard } from "@/components/kiosk/scanned-item-card";
import { StudentInfoPanel } from "@/components/kiosk/student-info-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatTimestamp, normalizeBarcode, normalizeEmail, normalizeStudentId } from "@/lib/utils";
import type { BorrowCartItem, InventoryItem } from "@/types/inventory";

type BorrowKioskProps = {
  inventory: InventoryItem[];
};

type StatusState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

export function BorrowKiosk({ inventory }: BorrowKioskProps) {
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [activeField, setActiveField] = useState<"studentId" | "email">("studentId");
  const [scannerValue, setScannerValue] = useState("");
  const [cart, setCart] = useState<BorrowCartItem[]>([]);
  const [status, setStatus] = useState<StatusState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const canSubmit =
    normalizeStudentId(studentId).length > 0 &&
    normalizeEmail(email).length > 0 &&
    cart.length > 0 &&
    !isSubmitting;

  function handleKeyboardKey(key: string) {
    if (activeField === "studentId") {
      setStudentId((current) => `${current}${key}`.toUpperCase());
      return;
    }

    setEmail((current) => `${current}${key}`.toLowerCase());
  }

  function handleKeyboardBackspace() {
    if (activeField === "studentId") {
      setStudentId((current) => current.slice(0, -1));
      return;
    }

    setEmail((current) => current.slice(0, -1));
  }

  function handleKeyboardClear() {
    if (activeField === "studentId") {
      setStudentId("");
      return;
    }

    setEmail("");
  }

  function handleScanSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const barcode = normalizeBarcode(scannerValue);

    if (!barcode) {
      setStatus({
        tone: "error",
        message: "Scan an item barcode before adding it to the cart."
      });
      return;
    }

    const matchedInventory = inventory.find(
      (entry) => normalizeBarcode(entry.barcode) === barcode
    );

    if (!matchedInventory) {
      setStatus({
        tone: "error",
        message: `Barcode ${barcode} was not found in the inventory sheet.`
      });
      return;
    }

    if (matchedInventory.available === 0) {
      setStatus({
        tone: "error",
        message: `${matchedInventory.name} is currently unavailable.`
      });
      return;
    }

    const existingItem = cart.find((entry) => normalizeBarcode(entry.barcode) === barcode);

    if (existingItem && existingItem.quantity >= matchedInventory.available) {
      setStatus({
        tone: "error",
        message: `Only ${matchedInventory.available} unit(s) of ${matchedInventory.name} are available.`
      });
      return;
    }

    setCart((current) => {
      if (!existingItem) {
        return [...current, { ...matchedInventory, quantity: 1 }];
      }

      return current.map((entry) =>
        normalizeBarcode(entry.barcode) === barcode
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry
      );
    });

    setScannerValue("");
    setStatus({
      tone: "success",
      message: `${matchedInventory.name} added to the cart.`
    });
  }

  function handleQuantityChange(barcode: string, quantity: number) {
    setCart((current) =>
      current.map((item) =>
        normalizeBarcode(item.barcode) === normalizeBarcode(barcode)
          ? { ...item, quantity }
          : item
      )
    );
  }

  function handleRemove(barcode: string) {
    setCart((current) =>
      current.filter((item) => normalizeBarcode(item.barcode) !== normalizeBarcode(barcode))
    );
  }

  async function handleConfirmBorrow() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/borrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId: normalizeStudentId(studentId),
          email: normalizeEmail(email),
          items: cart.map((item) => ({
            barcode: item.barcode,
            quantity: item.quantity
          }))
        })
      });
      const result = (await response.json()) as {
        error?: string;
        emailSent?: boolean;
        borrowedAt?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Borrow transaction failed.");
      }

      const receiptMessage = result.borrowedAt
        ? `Borrow recorded at ${formatTimestamp(result.borrowedAt)}.`
        : "Borrow recorded successfully.";

      setCart([]);
      setScannerValue("");
      setStudentId("");
      setEmail("");
      setActiveField("studentId");
      setStatus({
        tone: "success",
        message: result.emailSent
          ? `${receiptMessage} Confirmation emails were sent.`
          : `${receiptMessage} Inventory updated, but the confirmation email could not be sent.`
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Borrow transaction failed."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <StudentInfoPanel
        studentId={studentId}
        email={email}
        activeField={activeField}
        onStudentIdChange={(value) => setStudentId(value.toUpperCase())}
        onEmailChange={(value) => setEmail(value.toLowerCase())}
        onFocusField={setActiveField}
        onKeyboardKey={handleKeyboardKey}
        onKeyboardBackspace={handleKeyboardBackspace}
        onKeyboardClear={handleKeyboardClear}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <ScanLine className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Scan Equipment</h2>
                  <p className="text-sm text-slate-600">
                    Use a USB scanner or type the barcode and press Enter.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge tone="blue">{cart.length} item types</Badge>
              <Badge tone="green">{totalUnits} total units</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleScanSubmit} className="flex flex-col gap-3 lg:flex-row">
              <Input
                value={scannerValue}
                onChange={(event) => setScannerValue(event.target.value)}
                placeholder="Scan barcode"
                className="h-14 flex-1 text-base"
              />
              <Button type="submit" size="xl" className="rounded-2xl px-8">
                Add to cart
              </Button>
            </form>

            {status ? (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
                  status.tone === "success" &&
                    "border-emerald-200 bg-emerald-50 text-emerald-800",
                  status.tone === "error" && "border-rose-200 bg-rose-50 text-rose-800"
                )}
              >
                {status.tone === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{status.message}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <ShoppingCart className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Scanned Items</h2>
                <p className="text-sm text-slate-600">
                  Review the cart before confirming the borrow transaction.
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="xl"
              className="rounded-2xl px-8"
              disabled={!canSubmit}
              onClick={handleConfirmBorrow}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Borrow
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
                <p className="text-base font-medium text-slate-700">No items scanned yet.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Items will appear here as soon as their barcodes are scanned.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const maxQuantity =
                  inventory.find(
                    (inventoryItem) =>
                      normalizeBarcode(inventoryItem.barcode) === normalizeBarcode(item.barcode)
                  )?.available ?? item.quantity;

                return (
                  <ScannedItemCard
                    key={item.barcode}
                    item={item}
                    maxQuantity={Math.max(maxQuantity, 1)}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                  />
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
