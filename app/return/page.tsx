import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReturnKiosk } from "@/components/kiosk/return-kiosk";
import { AppShell } from "@/components/layout/app-shell";
import { buttonStyles } from "@/components/ui/button";

export default function ReturnPage() {
  return (
    <AppShell
      title="Return Equipment"
      subtitle="Identify the borrower, scan each physical item, and finalize the receipt."
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
      <ReturnKiosk />
    </AppShell>
  );
}

