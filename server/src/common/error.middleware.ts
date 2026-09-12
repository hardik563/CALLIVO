import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => e.message).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessages || 'Invalid request payload.',
      errors: err.errors,
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target ? `Duplicate value for ${err.meta.target}` : 'Resource already exists';
    return res.status(409).json({
      success: false,
      message: field,
    });
  }

  // Log unexpected errors
  console.error('[UNHANDLED ERROR]', err);

  return res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred. Please try again later.',
  });
};
