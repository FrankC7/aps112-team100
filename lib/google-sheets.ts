import { google } from "googleapis";
import { AppError } from "@/lib/api";
import { getSheetsEnv } from "@/lib/env";
import { normalizeBarcode, normalizeEmail, normalizeStudentId } from "@/lib/utils";
import type {
  ActiveTransactionRecord,
  InventoryAdjustment,
  InventoryItem,
  StudentLookupFilter
} from "@/types/inventory";

type InventorySheetRecord = InventoryItem & {
  rowIndex: number;
};

const SHEETS_SCOPE = ["https://www.googleapis.com/auth/spreadsheets"];

function getSheetsClient() {
  const env = getSheetsEnv();
  const auth = new google.auth.JWT({
    email: env.GOOGLE_CLIENT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY,
    scopes: SHEETS_SCOPE
  });

  return google.sheets({
    version: "v4",
    auth
  });
}

async function readSheet(range: string) {
  const env = getSheetsEnv();
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range
  });

  return response.data.values ?? [];
}

async function batchWrite(
  updates: Array<{
    range: string;
    values: Array<Array<string | number>>;
  }>
) {
  const env = getSheetsEnv();
  const sheets = getSheetsClient();

  if (updates.length === 0) {
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: updates
    }
  });
}

export async function getInventoryRecords(): Promise<InventoryItem[]> {
  const env = getSheetsEnv();
  const rows = await readSheet(`${env.GOOGLE_INVENTORY_SHEET_NAME}!A2:D`);

  return rows
    .filter((row) => Boolean(row[1]))
    .map((row) => ({
      name: String(row[0] ?? "").trim(),
      barcode: normalizeBarcode(String(row[1] ?? "")),
      available: Number(row[2] ?? 0),
      total: Number(row[3] ?? 0)
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function getInventoryRecordsWithRowIndex(): Promise<InventorySheetRecord[]> {
  const env = getSheetsEnv();
  const rows = await readSheet(`${env.GOOGLE_INVENTORY_SHEET_NAME}!A2:D`);

  return rows
    .map((row, index) => ({
      rowIndex: index + 2,
      name: String(row[0] ?? "").trim(),
      barcode: normalizeBarcode(String(row[1] ?? "")),
      available: Number(row[2] ?? 0),
      total: Number(row[3] ?? 0)
    }))
    .filter((row) => Boolean(row.barcode));
}

export async function updateInventoryAvailability(adjustments: InventoryAdjustment[]) {
  const env = getSheetsEnv();
  const inventory = await getInventoryRecordsWithRowIndex();
  const inventoryByBarcode = new Map(
    inventory.map((item) => [normalizeBarcode(item.barcode), item] as const)
  );
  const mergedAdjustments = new Map<string, number>();

  for (const adjustment of adjustments) {
    const barcode = normalizeBarcode(adjustment.barcode);
    mergedAdjustments.set(barcode, (mergedAdjustments.get(barcode) ?? 0) + adjustment.delta);
  }

  const updates = Array.from(mergedAdjustments.entries()).map(([barcode, delta]) => {
    const inventoryRecord = inventoryByBarcode.get(barcode);

    if (!inventoryRecord) {
      throw new AppError(`Inventory barcode ${barcode} does not exist.`, 404);
    }

    const nextAvailable = inventoryRecord.available + delta;

    if (nextAvailable < 0) {
      throw new AppError(
        `${inventoryRecord.name} does not have enough stock to satisfy this request.`,
        409
      );
    }

    if (nextAvailable > inventoryRecord.total) {
      throw new AppError(
        `${inventoryRecord.name} cannot exceed its total inventory count.`,
        409
      );
    }

    return {
      range: `${env.GOOGLE_INVENTORY_SHEET_NAME}!C${inventoryRecord.rowIndex}`,
      values: [[nextAvailable]]
    };
  });

  await batchWrite(updates);
}

export async function appendBorrowTransactions({
  studentId,
  email,
  items,
  borrowedAt
}: {
  studentId: string;
  email: string;
  items: Array<{
    barcode: string;
    quantity: number;
  }>;
  borrowedAt: string;
}) {
  const env = getSheetsEnv();
  const sheets = getSheetsClient();
  const rows: string[][] = [];

  for (const item of items) {
    for (let count = 0; count < item.quantity; count += 1) {
      rows.push([studentId, email, normalizeBarcode(item.barcode), borrowedAt, "", "Borrowed"]);
    }
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: `${env.GOOGLE_TRANSACTION_SHEET_NAME}!A:F`,
    valueInputOption: "RAW",
    requestBody: {
      values: rows
    }
  });
}

export async function getActiveTransactionsForStudent(
  filter: StudentLookupFilter
): Promise<ActiveTransactionRecord[]> {
  const env = getSheetsEnv();
  const rows = await readSheet(`${env.GOOGLE_TRANSACTION_SHEET_NAME}!A2:F`);
  const normalizedStudentId = filter.studentId ? normalizeStudentId(filter.studentId) : undefined;
  const normalizedEmail = filter.email ? normalizeEmail(filter.email) : undefined;

  return rows
    .map((row, index) => ({
      rowIndex: index + 2,
      studentId: normalizeStudentId(String(row[0] ?? "")),
      email: normalizeEmail(String(row[1] ?? "")),
      barcode: normalizeBarcode(String(row[2] ?? "")),
      borrowDate: String(row[3] ?? ""),
      returnDate: String(row[4] ?? ""),
      status: String(row[5] ?? "")
    }))
    .filter((row) => {
      if (!row.barcode || row.status.toLowerCase() !== "borrowed") {
        return false;
      }

      const matchesStudentId = normalizedStudentId ? row.studentId === normalizedStudentId : true;
      const matchesEmail = normalizedEmail ? row.email === normalizedEmail : true;
      return matchesStudentId && matchesEmail;
    });
}

export async function finalizeReturnTransactions(
  filter: StudentLookupFilter,
  items: Array<{
    barcode: string;
    quantity: number;
  }>,
  returnedAt: string
) {
  const env = getSheetsEnv();
  const groupedTransactions = new Map<string, ActiveTransactionRecord[]>();
  const activeTransactions = await getActiveTransactionsForStudent(filter);

  for (const transaction of activeTransactions) {
    const barcode = normalizeBarcode(transaction.barcode);
    groupedTransactions.set(barcode, [
      ...(groupedTransactions.get(barcode) ?? []),
      transaction
    ]);
  }

  const logUpdates: Array<{
    range: string;
    values: Array<Array<string>>;
  }> = [];

  for (const item of items) {
    const barcode = normalizeBarcode(item.barcode);
    const matchingTransactions = groupedTransactions.get(barcode) ?? [];

    if (matchingTransactions.length < item.quantity) {
      throw new AppError(
        `Only ${matchingTransactions.length} active unit(s) exist for barcode ${barcode}.`,
        409
      );
    }

    const selectedTransactions = matchingTransactions.splice(0, item.quantity);

    for (const transaction of selectedTransactions) {
      logUpdates.push({
        range: `${env.GOOGLE_TRANSACTION_SHEET_NAME}!E${transaction.rowIndex}:F${transaction.rowIndex}`,
        values: [[returnedAt, "Returned"]]
      });
    }
  }

  await batchWrite(logUpdates);
  await updateInventoryAvailability(
    items.map((item) => ({
      barcode: item.barcode,
      delta: item.quantity
    }))
  );
}

