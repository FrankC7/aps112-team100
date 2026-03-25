export type InventoryItem = {
  name: string;
  barcode: string;
  available: number;
  total: number;
};

export type BorrowCartItem = InventoryItem & {
  quantity: number;
};

export type InventoryAdjustment = {
  barcode: string;
  delta: number;
};

export type StudentLookupFilter = {
  studentId?: string;
  email?: string;
};

export type ActiveTransactionRecord = {
  rowIndex: number;
  studentId: string;
  email: string;
  barcode: string;
  borrowDate: string;
  returnDate: string;
  status: string;
};

export type ActiveBorrowedItem = {
  barcode: string;
  name: string;
  borrowedCount: number;
};

export type ReturnLookupResponse = {
  studentId: string;
  email: string;
  items: ActiveBorrowedItem[];
};

