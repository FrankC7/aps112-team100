"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BorrowCartItem } from "@/types/inventory";

type ScannedItemCardProps = {
  item: BorrowCartItem;
  maxQuantity: number;
  onQuantityChange: (barcode: string, quantity: number) => void;
  onRemove: (barcode: string) => void;
};

export function ScannedItemCard({
  item,
  maxQuantity,
  onQuantityChange,
  onRemove
}: ScannedItemCardProps) {
  return (
    <Card className="border border-slate-100 p-5 shadow-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
            <Badge tone="blue">{item.available} available</Badge>
          </div>
          <p className="text-sm text-slate-500">Barcode: {item.barcode}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600">
            Quantity
            <select
              value={item.quantity}
              onChange={(event) => onQuantityChange(item.barcode, Number(event.target.value))}
              className="ml-3 h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((quantity) => (
                <option key={quantity} value={quantity}>
                  {quantity}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="ghost"
            size="md"
            className="rounded-2xl text-rose-700 hover:bg-rose-50"
            onClick={() => onRemove(item.barcode)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>
    </Card>
  );
}

