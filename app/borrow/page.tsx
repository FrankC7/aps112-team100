import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BorrowKiosk } from "@/components/kiosk/borrow-kiosk";
import { AppShell } from "@/components/layout/app-shell";
import { buttonStyles } from "@/components/ui/button";
import { getInventoryRecords } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function BorrowPage() {
  const inventory = await getInventoryRecords();

  return (
    <AppShell
      title="Borrow Equipment"
      subtitle="Capture student details on the left, then scan each barcode into the cart."
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
      <BorrowKiosk inventory={inventory} />
    </AppShell>
  );
}

