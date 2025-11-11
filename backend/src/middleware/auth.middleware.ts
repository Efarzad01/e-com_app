import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import redisClient from '../config/redis';
import { AppError } from './errorHandler.middleware';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT access token from Authorization header or cookies
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Check if token is blacklisted (for logout functionality)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked', 401);
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        accountLockedUntil: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new AppError('Account is temporarily locked', 403);
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};

/**
 * Authorization middleware - Role-based access control
 * @param allowedRoles - Array of roles allowed to access the route
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (token) {
      const payload = verifyAccessToken(token);
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);

      if (!isBlacklisted) {
        req.user = payload;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Verify email middleware
 * Ensures user has verified their email
 */
export const requireEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isEmailVerified: true },
    });

    if (!user?.isEmailVerified) {
      throw new AppError('Email verification required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns the resource
 * @param getUserId - Function to extract user ID from request params/body
 */
export const checkOwnership = (getUserId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const resourceUserId = getUserId(req);
    const userRole = req.user.role as Role;

    // Admins can access all resources
    if (userRole === Role.ADMIN) {
      return next();
    }

    // Check if user owns the resource
    if (req.user.userId !== resourceUserId) {
      throw new AppError('Access denied', 403);
    }

    next();
  };
};

export default { authenticate, authorize, optionalAuth, requireEmailVerification, checkOwnership };
