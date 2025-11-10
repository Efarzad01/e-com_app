import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler.middleware';
import sanitizeHtml from 'sanitize-html';

/**
 * Validate request data against Zod schema
 * @param schema - Zod schema to validate against
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new AppError('Validation failed', 400, errors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Sanitize request body to prevent XSS attacks
 * Removes potentially dangerous HTML/scripts from string inputs
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, {
      allowedTags: [], // Remove all HTML tags
      allowedAttributes: {},
    }).trim();
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (page < 1) {
    throw new AppError('Page must be greater than 0', 400);
  }

  if (limit < 1 || limit > 100) {
    throw new AppError('Limit must be between 1 and 100', 400);
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};

/**
 * Validate UUID parameters
 */
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuid || !uuidRegex.test(uuid)) {
      throw new AppError(`Invalid ${paramName}`, 400);
    }

    next();
  };
};

/**
 * Prevent NoSQL injection in MongoDB-like queries
 * Even though we're using Prisma (which is safe), this adds an extra layer
 */
export const preventNoSQLInjection = (req: Request, res: Response, next: NextFunction): void => {
  const removeProhibited = (obj: any): any => {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          removeProhibited(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = removeProhibited(req.body);
  }
  if (req.query) {
    req.query = removeProhibited(req.query);
  }
  if (req.params) {
    req.params = removeProhibited(req.params);
  }

  next();
};

export default {
  validate,
  sanitizeBody,
  validatePagination,
  validateUUID,
  preventNoSQLInjection,
};
