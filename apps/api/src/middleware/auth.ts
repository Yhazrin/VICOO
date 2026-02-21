import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory token store (for MVP)
// In production, use Redis or database
const tokens: Map<string, { userId: string; createdAt: Date }> = new Map();

function isStrictAuthEnabled(): boolean {
  const authMode = process.env.AUTH_MODE;
  const isProduction = process.env.NODE_ENV === 'production';

  if (authMode === 'strict') return true;
  if (authMode === 'relaxed') return false;

  return isProduction;
}

function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

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
  if (!isStrictAuthEnabled()) {
    // Dev/relaxed mode: set a default user
    (req as any).userId = 'dev_user_1';
    next();
    return;
  }

  const authHeader = req.headers.authorization;

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
  if (!isDevelopmentEnvironment()) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    });
  }

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
