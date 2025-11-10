import prisma from '../config/database';
import redisClient from '../config/redis';
import { hashPassword, comparePassword, generateSecureToken } from '../utils/encryption';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, send2FASetupEmail } from '../utils/email';
import { AppError } from '../middleware/errorHandler.middleware';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Role } from '@prisma/client';
import config from '../config';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate email verification token
    const verificationToken = generateSecureToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        emailVerificationToken: verificationToken,
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Create cart and wishlist for the user
    await Promise.all([
      prisma.cart.create({ data: { userId: user.id } }),
      prisma.wishlist.create({ data: { userId: user.id } }),
    ]);

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    return {
      user,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData, ipAddress?: string, userAgent?: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 60000
      );
      throw new AppError(
        `Account is locked. Try again in ${minutesLeft} minutes`,
        403
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      // Lock account if max attempts reached
      if (failedAttempts >= config.security.maxLoginAttempts) {
        updateData.accountLockedUntil = new Date(
          Date.now() + config.security.accountLockoutDuration
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new AppError('Invalid credentials', 401);
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!data.twoFactorCode) {
        throw new AppError('Two-factor authentication code required', 403);
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: data.twoFactorCode,
        window: 2, // Allow 2 time steps before/after
      });

      if (!isValid) {
        throw new AppError('Invalid two-factor authentication code', 401);
      }
    }

    // Reset failed login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError('Refresh token required', 401);
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if user exists and refresh token matches
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Update session
    await prisma.session.updateMany({
      where: { token: refreshToken },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(userId: string, accessToken: string) {
    // Remove refresh token from database
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Delete all sessions for the user
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Blacklist the access token (stored in Redis with TTL)
    await redisClient.setEx(
      `blacklist:${accessToken}`,
      900, // 15 minutes (same as access token expiry)
      'true'
    );

    return { message: 'Logout successful' };
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId: string) {
    // Delete all sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Remove refresh token
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out from all devices' };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link will be sent' };
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link will be sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null, // Invalidate all sessions
      },
    });

    // Delete all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Password reset successful' };
  }

  /**
   * Setup 2FA
   */
  async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.twoFactorEnabled) {
      throw new AppError('Two-factor authentication is already enabled', 400);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `E-Commerce (${user.email})`,
      issuer: 'E-Commerce Platform',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store secret (temporarily, until verified)
    await redisClient.setEx(
      `2fa:setup:${userId}`,
      600, // 10 minutes
      secret.base32
    );

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  /**
   * Verify and enable 2FA
   */
  async verify2FA(userId: string, token: string) {
    // Get temporary secret from Redis
    const secret = await redisClient.get(`2fa:setup:${userId}`);

    if (!secret) {
      throw new AppError('2FA setup expired, please start again', 400);
    }

    // Verify token
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new AppError('Invalid verification code', 400);
    }

    // Enable 2FA and store secret
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
      },
    });

    // Remove temporary secret
    await redisClient.del(`2fa:setup:${userId}`);

    // Send confirmation email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user) {
      await send2FASetupEmail(user.email);
    }

    return { message: 'Two-factor authentication enabled successfully' };
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401);
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });

    return { message: 'Two-factor authentication disabled successfully' };
  }
}

export default new AuthService();
