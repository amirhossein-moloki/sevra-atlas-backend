import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface TokenPayload {
  sub: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, config.auth.jwt.accessSecret, { expiresIn: config.auth.jwt.accessTtl });
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, config.auth.jwt.refreshSecret, { expiresIn: config.auth.jwt.refreshTtl });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.auth.jwt.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.auth.jwt.refreshSecret) as TokenPayload;
};
