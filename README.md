# Student Equipment Kiosk

Specialized inventory management system for a student equipment kiosk, built with Next.js App Router, Tailwind CSS, Google Sheets, and Resend.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS for the kiosk UI
- Google Sheets API as the operational datastore
- Resend for automated borrow and return receipt emails
- Lucide React for icons

## Project Structure

```text
.
├── app
│   ├── api
│   │   ├── borrow/route.ts
│   │   ├── inventory/route.ts
│   │   └── return
│   │       ├── lookup/route.ts
│   │       └── route.ts
│   ├── borrow/page.tsx
│   ├── inventory/page.tsx
│   ├── return/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── kiosk
│   │   ├── borrow-kiosk.tsx
│   │   ├── return-kiosk.tsx
│   │   ├── scanned-item-card.tsx
│   │   ├── student-info-panel.tsx
│   │   └── virtual-keyboard.tsx
│   ├── layout/app-shell.tsx
│   └── ui
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib
│   ├── api.ts
│   ├── email.ts
│   ├── env.ts
│   ├── google-sheets.ts
│   └── utils.ts
├── types
│   └── inventory.ts
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Core Routes

- `/` Home page with large kiosk actions for borrowing and returning.
- `/borrow` Two-column borrow flow with student information, touch keyboard, scanner input, and cart review.
- `/return` Student lookup, scan-to-match return workflow, and receipt confirmation.
- `/inventory` Public read-only inventory view with availability and total counts only.
- `/api/inventory` Public JSON endpoint for inventory availability.
- `/api/borrow` Server route that decrements inventory, appends borrow transactions, and sends emails.
- `/api/return/lookup` Server route that resolves all active borrowed items for one student.
- `/api/return` Server route that marks items returned, increments inventory, and sends emails.

## Google Sheets Layout

Create one Google Sheet with exactly two tabs.

### Tab 1: `Current Inventory`

Headers in row 1:

```text
Name | Barcode | Available | Total
```

Example:

```text
Arduino Uno | ARD-0001 | 8 | 10
Digital Multimeter | DMM-0007 | 12 | 12
```

### Tab 2: `Transaction Logs`

Headers in row 1:

```text
Student ID | Email | Barcode | Borrow Date | Return Date | Status
```

Important behavior:

- Each borrowed unit writes one log row.
- Returns update the matching borrowed row with `Return Date` and `Status = Returned`.
- Active loans are rows where `Status = Borrowed`.

## Google Service Account Setup

1. Create a Google Cloud project.
2. Enable the Google Sheets API.
3. Create a service account.
4. Generate a JSON key for that service account.
5. Share the Google Sheet with the service account email so it has edit access.
6. Copy the following values into Vercel or `.env.local`:

```bash
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_INVENTORY_SHEET_NAME="Current Inventory"
GOOGLE_TRANSACTION_SHEET_NAME="Transaction Logs"
```

Notes:

- Keep the private key wrapped in quotes.
- Preserve `\n` line breaks exactly as shown.
- If you rename the tabs, update the corresponding env vars.

## Email Setup With Resend

1. Create a Resend account.
2. Verify a sending domain or sender address.
3. Set these environment variables:

```bash
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=kiosk@yourdomain.com
ADMIN_EMAIL=lab-admin@university.edu
```

Behavior:

- Borrow flow sends a confirmation to the student and a copy to the admin email.
- Return flow sends a return receipt to the student and a copy to the admin email.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploying To Vercel

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Add all variables from `.env.example` into the Vercel project settings.
4. Redeploy after saving the environment variables.

Because the app uses Google Sheets and Resend on the server side, make sure the deployment target runs with the Node.js runtime. The route handlers already declare `runtime = "nodejs"`.

## Implementation Notes

- Borrow transactions check live availability before decrementing inventory.
- Return transactions only accept barcodes that belong to that student’s active borrowed list.
- The public inventory page intentionally excludes all student and transaction data.
- The UI is designed for large touch targets and kiosk-style operation on desktop or tablet.

## Main Components

### `components/kiosk/borrow-kiosk.tsx`

- Manages the two-column borrow workflow.
- Captures Student ID and email.
- Uses a barcode-like input for scanning items into the cart.
- Supports quantity changes and item removal.
- Calls `/api/borrow` only when the form is complete.

### `components/kiosk/return-kiosk.tsx`

- Handles student lookup by Student ID or email.
- Displays currently borrowed items for that student.
- Matches scanned return barcodes against the active borrowed list.
- Finalizes the return with `/api/return`.

## Recommended Next Improvements

- Add authentication for staff-only routes if the kiosk will also be used outside a supervised area.
- Add a dedicated admin dashboard for transaction search and overdue views.
- Add barcode print support and a transaction export route for staff reporting.
