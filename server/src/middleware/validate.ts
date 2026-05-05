import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodSchema } from "zod";

export type ValidateSource = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, source: ValidateSource = "body"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[source]);
    (req[source] as unknown) = parsed;
    next();
  };
}
