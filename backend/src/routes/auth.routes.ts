import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema, resetPasswordSchema } from '../utils/validators';
import { authLimiter, passwordResetLimiter, emailVerificationLimiter } from '../middleware/rateLimiter.middleware';
import { z } from 'zod';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validate(z.object({ body: registerSchema })),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(z.object({ body: loginSchema })),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  emailVerificationLimiter,
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(z.object({ body: resetPasswordSchema })),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/2fa/setup
 * @desc    Setup 2FA
 * @access  Private
 */
router.post('/2fa/setup', authenticate, authController.setup2FA);

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify and enable 2FA
 * @access  Private
 */
router.post('/2fa/verify', authenticate, authController.verify2FA);

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', authenticate, authController.disable2FA);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

export default router;
