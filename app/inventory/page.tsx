import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { getInventoryRecords } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const inventory = await getInventoryRecords();

  return (
    <AppShell
      title="Public Inventory"
      subtitle="Read-only equipment availability. No borrower or transaction data is exposed here."
      actions={
        <Link
          href="/"
          className={buttonStyles({
            variant: "ghost",
            size: "md"
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      }
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-brand-900 text-sm uppercase tracking-[0.18em] text-white">
                <tr>
                  <th className="px-6 py-4 font-medium">Item Name</th>
                  <th className="px-6 py-4 font-medium">Current Amount Available</th>
                  <th className="px-6 py-4 font-medium">Total Item Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {inventory.map((item) => (
                  <tr key={item.barcode} className="hover:bg-brand-50/60">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                          <Package className="h-5 w-5" />
                        </span>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{item.available}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

