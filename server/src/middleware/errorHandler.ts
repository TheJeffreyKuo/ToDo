import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-errors.js";

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
  if (err instanceof HttpError) {
    return {
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
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
