export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function normalizeBarcode(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeStudentId(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short"
  });
}
