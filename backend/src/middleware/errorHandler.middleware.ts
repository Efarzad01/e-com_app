import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import config from '../config';

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Prisma errors and convert to AppError
 */
const handlePrismaError = (error: any): AppError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target as string[];
        return new AppError(
          `A record with this ${field?.join(', ')} already exists`,
          409
        );
      case 'P2003':
        // Foreign key constraint violation
        return new AppError('Referenced record does not exist', 400);
      case 'P2025':
        // Record not found
        return new AppError('Record not found', 404);
      case 'P2014':
        // Required relation violation
        return new AppError('Invalid relation', 400);
      default:
        return new AppError('Database error occurred', 500);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError('Invalid data provided', 400);
  }

  return new AppError('Database error occurred', 500);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401);
  }
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401);
  }
  return new AppError('Authentication error', 401);
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = error;

  // Convert known errors to AppError
  if (error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError) {
    err = handlePrismaError(error);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    err = handleJWTError(error);
  } else if (!(error instanceof AppError)) {
    err = new AppError(error.message || 'Internal server error', 500);
  }

  const appError = err as AppError;
  const statusCode = appError.statusCode || 500;

  // Log error (don't log sensitive information in production)
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: appError.message,
      stack: config.env === 'development' ? appError.stack : undefined,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.userId,
    });
  } else {
    logger.warn('Client Error:', {
      message: appError.message,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    });
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message: appError.message,
      statusCode,
    },
  };

  // Include validation errors if present
  if (appError.errors) {
    errorResponse.error.errors = appError.errors;
  }

  // Include stack trace in development
  if (config.env === 'development') {
    errorResponse.error.stack = appError.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validate environment variables on startup
 */
export const validateEnv = (): void => {
  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'REDIS_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

export default { errorHandler, notFound, asyncHandler, AppError, validateEnv };
