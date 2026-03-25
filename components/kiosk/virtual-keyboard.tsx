"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "@"],
  ["Z", "X", "C", "V", "B", "N", "M", ".", "-", "_"]
];

type VirtualKeyboardProps = {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
};

export function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onClear
}: VirtualKeyboardProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="space-y-2">
        {KEY_ROWS.map((row) => (
          <div key={row.join("-")} className="grid grid-cols-10 gap-2">
            {row.map((key) => (
              <Button
                key={key}
                type="button"
                variant="secondary"
                size="lg"
                className="h-12 rounded-2xl text-sm font-semibold"
                onClick={() => onKeyPress(key)}
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-[1.1fr_2fr_1fr] gap-2">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-12 rounded-2xl"
          onClick={onClear}
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12 rounded-2xl"
          onClick={() => onKeyPress(" ")}
        >
          Space
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-12 rounded-2xl"
          onClick={onBackspace}
        >
          <Delete className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

