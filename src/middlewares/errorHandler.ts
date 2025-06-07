import { Request, Response } from 'express';

// This file defines a global error handler for the application.
export interface AppError extends Error {
  status?: number;
}

// Custom error handler middleware
// This middleware catches errors thrown in the application and sends a JSON response with the error message and status code.
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
};