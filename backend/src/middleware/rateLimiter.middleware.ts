import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';
import config from '../config';

/**
 * General API rate limiter
 * Limits requests per IP address
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: config.rateLimit.windowMs / 1000,
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use Redis for distributed rate limiting (important for multiple server instances)
  store: new RedisStore({
    // @ts-ignore - Known typing issue with redis v4
    client: redisClient,
    prefix: 'rl:api:',
  }),
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Strict rate limiter for authentication routes
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests per window
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: 900, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:auth:',
  }),
});

/**
 * Rate limiter for password reset
 * Prevents abuse of password reset functionality
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:reset:',
  }),
});

/**
 * Rate limiter for email verification
 * Prevents email spam
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 requests per hour
  message: {
    error: 'Too many verification email requests, please try again later',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:verify:',
  }),
});

/**
 * Rate limiter for API writes (POST, PUT, DELETE)
 * More restrictive than read operations
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 write requests per window
  message: {
    error: 'Too many write requests, please try again later',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to write operations
    return !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  },
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:write:',
  }),
});

/**
 * Strict rate limiter for checkout/payment routes
 * Prevents fraudulent transactions
 */
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Only 10 checkouts per hour
  message: {
    error: 'Too many checkout attempts, please try again later',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:checkout:',
  }),
});

/**
 * Rate limiter for search operations
 * Prevents search abuse
 */
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    error: 'Too many search requests, please slow down',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:search:',
  }),
});

export default {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  writeLimiter,
  checkoutLimiter,
  searchLimiter,
};
