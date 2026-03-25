import Link from "next/link";
import { ArrowRightLeft, ClipboardList, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { buttonStyles } from "@/components/ui/button";

export default function HomePage() {
  return (
    <AppShell
      title="Student Equipment Kiosk"
      subtitle="Fast self-service borrowing and returns for shared academic equipment."
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/borrow"
            className={`${buttonStyles({
              variant: "primary",
              size: "xl"
            })} min-h-56 flex-col items-start justify-between rounded-3xl p-8 text-left shadow-kiosk`}
          >
            <ArrowRightLeft className="h-12 w-12" />
            <div className="space-y-2">
              <p className="text-3xl font-semibold">Borrow an Item</p>
              <p className="max-w-xs text-base text-white/85">
                Scan equipment, attach it to a student, and send an instant receipt.
              </p>
            </div>
          </Link>

          <Link
            href="/return"
            className={`${buttonStyles({
              variant: "secondary",
              size: "xl"
            })} min-h-56 flex-col items-start justify-between rounded-3xl border-brand-200 bg-white p-8 text-left text-brand-900 shadow-kiosk`}
          >
            <RotateCcw className="h-12 w-12" />
            <div className="space-y-2">
              <p className="text-3xl font-semibold">Return an Item</p>
              <p className="max-w-xs text-base text-brand-800">
                Identify the borrower, scan each item, and finalize the return in one step.
              </p>
            </div>
          </Link>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white/85 p-8 shadow-kiosk backdrop-blur">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Public inventory view
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Staff and students can review current availability without exposing transaction history
            or personal information.
          </p>
          <Link
            href="/inventory"
            className={`${buttonStyles({
              variant: "ghost",
              size: "lg"
            })} mt-8 rounded-2xl`}
          >
            Open inventory table
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

