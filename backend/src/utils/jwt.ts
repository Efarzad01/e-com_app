import jwt from 'jsonwebtoken';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

/**
 * Generate JWT access token
 * Short-lived token for authentication (15 minutes)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiration,
    issuer: 'ecommerce-api',
    audience: 'ecommerce-client',
  });
};

/**
 * Generate JWT refresh token
 * Long-lived token for obtaining new access tokens (7 days)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    { ...payload, sessionId: uuidv4() },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiration,
      issuer: 'ecommerce-api',
      audience: 'ecommerce-client',
    }
  );
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.accessSecret, {
      issuer: 'ecommerce-api',
      audience: 'ecommerce-client',
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'ecommerce-api',
      audience: 'ecommerce-client',
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: TokenPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
