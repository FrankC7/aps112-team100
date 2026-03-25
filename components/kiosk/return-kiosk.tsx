"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ScanLine,
  User
} from "lucide-react";
import { VirtualKeyboard } from "@/components/kiosk/virtual-keyboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatTimestamp, normalizeBarcode, normalizeEmail, normalizeStudentId } from "@/lib/utils";
import type { ReturnLookupResponse } from "@/types/inventory";

type StatusState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

export function ReturnKiosk() {
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [activeField, setActiveField] = useState<"studentId" | "email">("studentId");
  const [lookupResult, setLookupResult] = useState<ReturnLookupResponse | null>(null);
  const [pendingReturns, setPendingReturns] = useState<Record<string, number>>({});
  const [scannerValue, setScannerValue] = useState("");
  const [status, setStatus] = useState<StatusState>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingCount = Object.values(pendingReturns).reduce((sum, count) => sum + count, 0);

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

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedStudentId = normalizeStudentId(studentId);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedStudentId && !normalizedEmail) {
      setStatus({
        tone: "error",
        message: "Enter a Student ID or email address to load borrowed items."
      });
      return;
    }

    setIsLookingUp(true);
    setStatus(null);
    setPendingReturns({});

    try {
      const params = new URLSearchParams(
        normalizedStudentId
          ? { studentId: normalizedStudentId }
          : { email: normalizedEmail }
      );
      const response = await fetch(`/api/return/lookup?${params.toString()}`);
      const result = (await response.json()) as ReturnLookupResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Could not load active borrowed items.");
      }

      setLookupResult(result);

      if (result.items.length === 0) {
        setStatus({
          tone: "success",
          message: "No active borrowed items were found for this student."
        });
      } else {
        setStatus({
          tone: "success",
          message: `Loaded ${result.items.length} borrowed item type(s) for return.`
        });
      }
    } catch (error) {
      setLookupResult(null);
      setStatus({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not load active borrowed items."
      });
    } finally {
      setIsLookingUp(false);
    }
  }

  function handleScanSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!lookupResult) {
      setStatus({
        tone: "error",
        message: "Load a student account before scanning returns."
      });
      return;
    }

    const barcode = normalizeBarcode(scannerValue);

    if (!barcode) {
      setStatus({
        tone: "error",
        message: "Scan a barcode before marking a return."
      });
      return;
    }

    const borrowedItem = lookupResult.items.find(
      (item) => normalizeBarcode(item.barcode) === barcode
    );

    if (!borrowedItem) {
      setStatus({
        tone: "error",
        message: `Barcode ${barcode} is not currently checked out to this student.`
      });
      return;
    }

    const pendingForBarcode = pendingReturns[barcode] ?? 0;

    if (pendingForBarcode >= borrowedItem.borrowedCount) {
      setStatus({
        tone: "error",
        message: `All borrowed units of ${borrowedItem.name} are already marked for return.`
      });
      return;
    }

    setPendingReturns((current) => ({
      ...current,
      [barcode]: pendingForBarcode + 1
    }));
    setScannerValue("");
    setStatus({
      tone: "success",
      message: `${borrowedItem.name} marked for return.`
    });
  }

  function decrementPending(barcode: string) {
    setPendingReturns((current) => {
      const nextValue = Math.max((current[barcode] ?? 0) - 1, 0);

      if (nextValue === 0) {
        const { [barcode]: _removed, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [barcode]: nextValue
      };
    });
  }

  async function handleFinalizeReturn() {
    if (!lookupResult || pendingCount === 0) {
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const items = lookupResult.items
        .map((item) => ({
          barcode: item.barcode,
          quantity: pendingReturns[normalizeBarcode(item.barcode)] ?? 0
        }))
        .filter((item) => item.quantity > 0);

      const response = await fetch("/api/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId: lookupResult.studentId || undefined,
          email: lookupResult.email || undefined,
          items
        })
      });
      const result = (await response.json()) as {
        error?: string;
        emailSent?: boolean;
        returnedAt?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Return transaction failed.");
      }

      const remainingItems = lookupResult.items
        .map((item) => {
          const pending = pendingReturns[normalizeBarcode(item.barcode)] ?? 0;
          return {
            ...item,
            borrowedCount: item.borrowedCount - pending
          };
        })
        .filter((item) => item.borrowedCount > 0);

      setLookupResult({
        ...lookupResult,
        items: remainingItems
      });
      setPendingReturns({});
      setScannerValue("");

      const receiptMessage = result.returnedAt
        ? `Return recorded at ${formatTimestamp(result.returnedAt)}.`
        : "Return recorded successfully.";

      setStatus({
        tone: "success",
        message: result.emailSent
          ? `${receiptMessage} Return receipt emails were sent.`
          : `${receiptMessage} Inventory updated, but the return email could not be sent.`
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Return transaction failed."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-full">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <User className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Student Lookup</h2>
              <p className="text-sm text-slate-600">
                Enter a Student ID or email to load active borrowed items.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLookup} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Student ID / T-Card
              </span>
              <Input
                value={studentId}
                placeholder="1001234567"
                onChange={(event) => setStudentId(event.target.value.toUpperCase())}
                onFocus={() => setActiveField("studentId")}
                className={cn(
                  activeField === "studentId" && "border-brand-500 ring-2 ring-brand-100"
                )}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <Input
                value={email}
                type="email"
                placeholder="student@university.edu"
                onChange={(event) => setEmail(event.target.value.toLowerCase())}
                onFocus={() => setActiveField("email")}
                className={cn(activeField === "email" && "border-brand-500 ring-2 ring-brand-100")}
              />
            </label>

            <Button type="submit" size="xl" className="w-full rounded-2xl" disabled={isLookingUp}>
              {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Login to active loans
            </Button>
          </form>

          <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-4">
            <div className="mb-3 text-sm font-medium text-brand-800">Touchscreen keyboard</div>
            <VirtualKeyboard
              onKeyPress={handleKeyboardKey}
              onBackspace={handleKeyboardBackspace}
              onClear={handleKeyboardClear}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <ScanLine className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Scan Returns</h2>
                <p className="text-sm text-slate-600">
                  Matching scans are staged here until you finalize the return.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge tone="blue">{lookupResult?.items.length ?? 0} active item types</Badge>
              <Badge tone="green">{pendingCount} units pending return</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleScanSubmit} className="flex flex-col gap-3 lg:flex-row">
              <Input
                value={scannerValue}
                onChange={(event) => setScannerValue(event.target.value)}
                placeholder="Scan return barcode"
                className="h-14 flex-1 text-base"
              />
              <Button
                type="submit"
                size="xl"
                className="rounded-2xl px-8"
                disabled={!lookupResult || lookupResult.items.length === 0}
              >
                Mark returned
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
                <RotateCcw className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Active Borrowed Items</h2>
                <p className="text-sm text-slate-600">
                  Each scan increments the pending return count for the matching borrowed item.
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="xl"
              className="rounded-2xl px-8"
              disabled={pendingCount === 0 || isSubmitting}
              onClick={handleFinalizeReturn}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Finalize Return
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {!lookupResult ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
                <p className="text-base font-medium text-slate-700">No student loaded yet.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Use the login panel to load a borrower’s active items before scanning.
                </p>
              </div>
            ) : lookupResult.items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
                <p className="text-base font-medium text-slate-700">
                  This student has no remaining active loans.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  If items are still in hand, verify that the barcode exists in the logs sheet.
                </p>
              </div>
            ) : (
              lookupResult.items.map((item) => {
                const pending = pendingReturns[normalizeBarcode(item.barcode)] ?? 0;
                const remaining = item.borrowedCount - pending;

                return (
                  <Card key={item.barcode} className="border border-slate-100 p-5 shadow-none">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                          <Badge tone="blue">{item.borrowedCount} borrowed</Badge>
                          {pending > 0 ? <Badge tone="green">{pending} staged</Badge> : null}
                        </div>
                        <p className="text-sm text-slate-500">Barcode: {item.barcode}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          {remaining} remaining after submit
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="md"
                          className="rounded-2xl"
                          disabled={pending === 0}
                          onClick={() => decrementPending(normalizeBarcode(item.barcode))}
                        >
                          Undo scan
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

