import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { authMiddleware, generateDevToken } from './auth.js';

type MockResponse = Partial<Response> & {
  statusCode?: number;
  body?: unknown;
};

function createMockResponse(): MockResponse {
  const res: MockResponse = {};
  res.status = ((code: number) => {
    res.statusCode = code;
    return res as Response;
  }) as Response['status'];
  res.json = ((payload: unknown) => {
    res.body = payload;
    return res as Response;
  }) as Response['json'];
  return res;
}

test('strict auth rejects requests without bearer token', () => {
  process.env.NODE_ENV = 'production';
  delete process.env.AUTH_MODE;

  const req = { headers: {} } as Request;
  const res = createMockResponse();
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };

  authMiddleware(req, res as Response, next);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, {
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authorization header required'
    }
  });
});

test('strict auth rejects requests with invalid token', () => {
  process.env.NODE_ENV = 'production';
  process.env.AUTH_MODE = 'strict';

  const req = { headers: { authorization: 'Bearer invalid_token' } } as Request;
  const res = createMockResponse();
  let nextCalled = false;

  authMiddleware(req, res as Response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, {
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token'
    }
  });
});

test('strict auth accepts requests with valid token', () => {
  process.env.NODE_ENV = 'production';
  process.env.AUTH_MODE = 'strict';

  const token = generateDevToken();
  const req = { headers: { authorization: `Bearer ${token}` } } as Request & { userId?: string };
  const res = createMockResponse();
  let nextCalled = false;

  authMiddleware(req, res as Response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
  assert.equal(req.userId, 'dev_user_1');
});
