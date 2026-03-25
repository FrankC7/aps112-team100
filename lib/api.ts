import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export function handleRouteError(error: unknown) {
  console.error(error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: error.issues[0]?.message ?? "The request body is invalid."
      },
      {
        status: 400
      }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: error.statusCode
      }
    );
  }

  return NextResponse.json(
    {
      error: "Unexpected server error."
    },
    {
      status: 500
    }
  );
}

