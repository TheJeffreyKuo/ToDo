import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

function toApiError(err: unknown): ApiError {
  if (err instanceof ZodError) {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: err.flatten(),
    };
  }
  if (err && typeof err === "object" && "status" in err && "code" in err) {
    const e = err as { status: number; code: string; message?: string; details?: unknown };
    return {
      status: e.status,
      code: e.code,
      message: e.message ?? "Request failed",
      details: e.details,
    };
  }
  return { status: 500, code: "INTERNAL", message: "Internal server error" };
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const apiErr = toApiError(err);
  if (apiErr.status >= 500) {
    console.error("[error]", err);
  }
  res.status(apiErr.status).json({
    error: { code: apiErr.code, message: apiErr.message, details: apiErr.details },
  });
};
