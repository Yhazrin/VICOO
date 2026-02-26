/**
 * Security middleware for production readiness.
 * - Helmet: HTTP security headers
 * - Rate limiting: per-IP request throttling
 * - Input sanitization: XSS prevention
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

// Helmet: secure HTTP headers
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Disable CSP for dev flexibility
  crossOriginEmbedderPolicy: false,
});

// Global rate limiter: 200 requests per minute per IP
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: '请求过于频繁，请稍后重试' } },
});

// Auth rate limiter: 10 attempts per 15 minutes per IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: '登录尝试过于频繁，请 15 分钟后重试' } },
});

// AI rate limiter: 30 requests per minute per IP
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'AI 请求过于频繁，请稍后重试' } },
});

// Input sanitization middleware
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: any): void {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Sanitize HTML/XSS but preserve markdown
      obj[key] = xss(obj[key], {
        whiteList: {},        // Strip all HTML tags
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style'],
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
