import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory token store (for MVP)
// In production, use Redis or database
const tokens: Map<string, { userId: string; createdAt: Date }> = new Map();

// Generate a simple dev token
export function generateDevToken(): string {
  const token = `dev_${uuidv4().replace(/-/g, '')}`;
  const userId = 'dev_user_1';

  tokens.set(token, { userId, createdAt: new Date() });

  return token;
}

// Get user ID from token
export function getUserFromToken(token: string): string | null {
  const tokenData = tokens.get(token);
  return tokenData?.userId || null;
}

// Auth middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const strictAuth = process.env.STRICT_AUTH === 'true';

  if (!strictAuth) {
    (req as any).userId = 'dev_user_1';
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header required'
      }
    });
  }

  const token = authHeader.slice(7);
  const userId = getUserFromToken(token);

  if (!userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }

  (req as any).userId = userId;
  next();
}

// Auth routes
import { Router } from 'express';

const authRouter = Router();

// POST /auth/dev-token - Generate a dev token (for development only)
authRouter.post('/dev-token', (req, res) => {
  const token = generateDevToken();
  res.json({
    data: {
      token,
      expiresAt: null // Dev tokens don't expire
    }
  });
});

// GET /auth/me - Get current user info
authRouter.get('/me', authMiddleware, (req, res) => {
  res.json({
    data: {
      id: (req as any).userId,
      name: 'Developer',
      email: 'dev@vicoo.local'
    }
  });
});

export default authRouter;
