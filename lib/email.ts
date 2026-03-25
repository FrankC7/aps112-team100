import { Resend } from "resend";
import { getEmailEnv } from "@/lib/env";
import { formatTimestamp } from "@/lib/utils";

type EmailItem = {
  name: string;
  barcode: string;
  quantity: number;
};

function buildReceiptHtml({
  heading,
  subheading,
  studentId,
  email,
  timestampLabel,
  timestamp,
  items
}: {
  heading: string;
  subheading: string;
  studentId: string;
  email: string;
  timestampLabel: string;
  timestamp: string;
  items: EmailItem[];
}) {
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">${item.name}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">${item.barcode}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="background:#f8fbff;padding:32px;font-family:Segoe UI,Helvetica Neue,sans-serif;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;background:white;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="background:#1e63d1;padding:24px 28px;color:white;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.8;">Student Equipment Kiosk</p>
          <h1 style="margin:0;font-size:28px;">${heading}</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">${subheading}</p>
        </div>
        <div style="padding:28px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tbody>
              <tr>
                <td style="padding:8px 0;color:#475569;width:180px;">Student ID</td>
                <td style="padding:8px 0;font-weight:600;">${studentId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#475569;">Email</td>
                <td style="padding:8px 0;font-weight:600;">${email}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#475569;">${timestampLabel}</td>
                <td style="padding:8px 0;font-weight:600;">${formatTimestamp(timestamp)}</td>
              </tr>
            </tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
            <thead style="background:#eff6ff;">
              <tr>
                <th style="padding:12px 16px;text-align:left;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1e3a8a;">Item</th>
                <th style="padding:12px 16px;text-align:left;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1e3a8a;">Barcode</th>
                <th style="padding:12px 16px;text-align:center;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1e3a8a;">Quantity</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function sendReceipt({
  subject,
  studentId,
  email,
  timestampLabel,
  timestamp,
  items
}: {
  subject: string;
  studentId: string;
  email: string;
  timestampLabel: string;
  timestamp: string;
  items: EmailItem[];
}) {
  const env = getEmailEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const html = buildReceiptHtml({
    heading: subject,
    subheading: "This receipt was generated automatically by the student equipment kiosk.",
    studentId,
    email,
    timestampLabel,
    timestamp,
    items
  });

  await Promise.all([
    resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject,
      html
    }),
    resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: env.ADMIN_EMAIL,
      subject: `Admin copy: ${subject}`,
      html
    })
  ]);
}

export async function sendBorrowReceipt({
  studentId,
  email,
  borrowedAt,
  items
}: {
  studentId: string;
  email: string;
  borrowedAt: string;
  items: EmailItem[];
}) {
  await sendReceipt({
    subject: "Borrow Confirmation",
    studentId,
    email,
    timestampLabel: "Borrowed At",
    timestamp: borrowedAt,
    items
  });
}

export async function sendReturnReceipt({
  studentId,
  email,
  returnedAt,
  items
}: {
  studentId: string;
  email: string;
  returnedAt: string;
  items: EmailItem[];
}) {
  await sendReceipt({
    subject: "Return Confirmation",
    studentId,
    email,
    timestampLabel: "Returned At",
    timestamp: returnedAt,
    items
  });
}

