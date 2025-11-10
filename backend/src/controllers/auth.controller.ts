import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import config from '../config';
import prisma from '../config/database';

class AuthController {
  /**
   * Register new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    const result = await authService.login(req.body, ipAddress, userAgent);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set access token in HTTP-only cookie (optional, can be sent in response instead)
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    const tokens = await authService.refreshToken(refreshToken);

    // Update cookies
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { tokens },
    });
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const accessToken = req.cookies.accessToken ||
      req.headers.authorization?.substring(7);

    await authService.logout(req.user!.userId, accessToken);

    // Clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  });

  /**
   * Logout from all devices
   */
  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAllDevices(req.user!.userId);

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices',
    });
  });

  /**
   * Verify email
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    const result = await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Request password reset
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Reset password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Setup 2FA
   */
  setup2FA = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.setup2FA(req.user!.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Verify and enable 2FA
   */
  verify2FA = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    const result = await authService.verify2FA(req.user!.userId, token);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Disable 2FA
   */
  disable2FA = asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body;

    const result = await authService.disable2FA(req.user!.userId, password);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get current user
   */
  getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { user },
    });
  });
}

export default new AuthController();
