"use client";

import { Keyboard, Mail, User } from "lucide-react";
import { VirtualKeyboard } from "@/components/kiosk/virtual-keyboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ActiveField = "studentId" | "email";

type StudentInfoPanelProps = {
  studentId: string;
  email: string;
  activeField: ActiveField;
  onStudentIdChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onFocusField: (field: ActiveField) => void;
  onKeyboardKey: (key: string) => void;
  onKeyboardBackspace: () => void;
  onKeyboardClear: () => void;
};

export function StudentInfoPanel({
  studentId,
  email,
  activeField,
  onStudentIdChange,
  onEmailChange,
  onFocusField,
  onKeyboardKey,
  onKeyboardBackspace,
  onKeyboardClear
}: StudentInfoPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <User className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Student Information</h2>
            <p className="text-sm text-slate-600">
              Borrowing is only enabled after both fields are completed.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <User className="h-4 w-4 text-brand-700" />
              Student ID / T-Card
            </span>
            <Input
              value={studentId}
              placeholder="1001234567"
              onChange={(event) => onStudentIdChange(event.target.value)}
              onFocus={() => onFocusField("studentId")}
              className={cn(activeField === "studentId" && "border-brand-500 ring-2 ring-brand-100")}
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail className="h-4 w-4 text-brand-700" />
              Email
            </span>
            <Input
              value={email}
              type="email"
              placeholder="student@university.edu"
              onChange={(event) => onEmailChange(event.target.value)}
              onFocus={() => onFocusField("email")}
              className={cn(activeField === "email" && "border-brand-500 ring-2 ring-brand-100")}
            />
          </label>
        </div>

        <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-800">
            <Keyboard className="h-4 w-4" />
            Touchscreen keyboard
          </div>
          <VirtualKeyboard
            onKeyPress={onKeyboardKey}
            onBackspace={onKeyboardBackspace}
            onClear={onKeyboardClear}
          />
        </div>
      </CardContent>
    </Card>
  );
}

