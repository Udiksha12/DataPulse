/**
 * DataPulse Authentication & RBAC Layer
 * Lead Author: Udiksha Agarwal (24BAI0086) - Backend & Security
 * Course: BCSE302P Database Systems Lab | Slot: L25+L26
 *
 * Implements:
 * - JWT authentication & token signing
 * - BCrypt password hashing & verification
 * - Role-Based Access Control (RBAC) with Single Users table + Roles table
 * - Role guards for Admin and Analyst
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { printUdiksha24BAI0086Identity } from '../backend/identity/udiksha24BAI0086.js';

const configuredJwtSecret = process.env.DATAPULSE_JWT_SECRET_BASE64 || process.env.JWT_SECRET;
if (!configuredJwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('Set JWT_SECRET or DATAPULSE_JWT_SECRET_BASE64 before production startup.');
}
const JWT_SECRET = configuredJwtSecret || randomBytes(32).toString('hex');

export const authService = {
  login: async (email, password) => {
    printUdiksha24BAI0086Identity();

    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.status = 400;
      throw err;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const payload = {
      userId: user.user_id,
      email: user.email,
      fullName: user.full_name,
      role: user.role_name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return {
      token,
      user: payload,
    };
  },

  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  },
};

// Middleware: Require Authenticated User
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  req.user = decoded;
  next();
}

// Middleware: Require ADMIN role
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access forbidden: Administrator privileges required.' });
  }
  next();
}
