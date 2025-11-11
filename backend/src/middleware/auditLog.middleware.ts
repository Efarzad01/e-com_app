import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

/**
 * Audit logging middleware
 * Logs critical operations for security and compliance
 */
export const auditLog = (action: string, entity: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original send function
    const originalSend = res.json;

    // Override res.json to capture response
    res.json = function (data: any) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log asynchronously to avoid blocking the response
        setImmediate(async () => {
          try {
            await prisma.auditLog.create({
              data: {
                userId: req.user?.userId,
                action,
                entity,
                entityId: req.params.id || data?.data?.id,
                changes: {
                  method: req.method,
                  path: req.path,
                  body: sanitizeLogData(req.body),
                  query: req.query,
                },
                ipAddress: req.ip || req.socket.remoteAddress,
                userAgent: req.get('user-agent'),
              },
            });

            logger.info('Audit log created', {
              action,
              entity,
              userId: req.user?.userId,
              ip: req.ip,
            });
          } catch (error) {
            logger.error('Failed to create audit log:', error);
          }
        });
      }

      // Call original send function
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Sanitize log data to remove sensitive information
 */
const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'passwordConfirm',
    'currentPassword',
    'newPassword',
    'token',
    'refreshToken',
    'accessToken',
    'secret',
    'apiKey',
    'creditCard',
    'cvv',
    'ssn',
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
};

export default auditLog;
