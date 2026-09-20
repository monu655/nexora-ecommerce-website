import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: String(user._id), type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.secret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);
