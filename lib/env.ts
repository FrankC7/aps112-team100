import { z } from "zod";

const sheetsEnvSchema = z.object({
  GOOGLE_SHEET_ID: z.string().min(1, "GOOGLE_SHEET_ID is required."),
  GOOGLE_CLIENT_EMAIL: z.string().email("GOOGLE_CLIENT_EMAIL must be a valid email."),
  GOOGLE_PRIVATE_KEY: z.string().min(1, "GOOGLE_PRIVATE_KEY is required."),
  GOOGLE_INVENTORY_SHEET_NAME: z.string().default("Current Inventory"),
  GOOGLE_TRANSACTION_SHEET_NAME: z.string().default("Transaction Logs")
});

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required."),
  RESEND_FROM_EMAIL: z.string().email("RESEND_FROM_EMAIL must be a valid email."),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email.")
});

let sheetsEnvCache:
  | (z.infer<typeof sheetsEnvSchema> & {
      GOOGLE_PRIVATE_KEY: string;
    })
  | null = null;
let emailEnvCache: z.infer<typeof emailEnvSchema> | null = null;

export function getSheetsEnv() {
  if (!sheetsEnvCache) {
    const env = sheetsEnvSchema.parse(process.env);
    sheetsEnvCache = {
      ...env,
      GOOGLE_PRIVATE_KEY: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  return sheetsEnvCache;
}

export function getEmailEnv() {
  if (!emailEnvCache) {
    emailEnvCache = emailEnvSchema.parse(process.env);
  }

  return emailEnvCache;
}

