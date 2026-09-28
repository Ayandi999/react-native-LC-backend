import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";

export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.format(),
    });
  }

  // 2. Custom AppError (BadRequestError, UnauthorizedError, NotFoundError, etc.)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // 3. Better Auth or external known errors
  if (err?.name === "BetterAuthError" || err?.code === "BETTER_AUTH_ERROR") {
    return res.status(400).json({
      success: false,
      error: err.message || "Authentication error",
    });
  }

  // 4. Default Internal Server Error
  console.error("Unhandled Error caught by Global Error Handler:", err);
  return res.status(500).json({
    success: false,
    error: err?.message || "Internal server error",
  });
};
