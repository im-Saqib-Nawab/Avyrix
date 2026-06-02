import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '@/config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const accessOptions: SignOptions = {
  expiresIn: config.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
};

const refreshOptions: SignOptions = {
  expiresIn: config.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
};

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, accessOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, refreshOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
}
