import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import process from 'node:process';

const port = 8130;
const baseUrl = `http://127.0.0.1:${port}`;

function waitForServer(proc, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for API server startup')), timeoutMs);

    proc.stdout.on('data', (chunk) => {
      if (String(chunk).includes('Server running on')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    proc.stderr.on('data', (chunk) => {
      const line = String(chunk);
      if (line.toLowerCase().includes('error')) {
        clearTimeout(timeout);
        reject(new Error(line));
      }
    });

    proc.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`API server exited early with code ${code}`));
    });
  });
}

let proc;

test.before(async () => {
  proc = spawn('pnpm', ['tsx', 'src/index.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      STRICT_AUTH: 'true'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await waitForServer(proc);
});

test.after(() => {
  if (proc && !proc.killed) {
    proc.kill('SIGTERM');
  }
});

test('health endpoint returns ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.data.ok, true);
});

test('notes list endpoint returns data array', async () => {
  const tokenRes = await fetch(`${baseUrl}/auth/dev-token`, { method: 'POST' });
  const tokenBody = await tokenRes.json();
  const token = tokenBody?.data?.token;
  assert.ok(token);

  const res = await fetch(`${baseUrl}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.data));
});

test('auth guard blocks unauthenticated /auth/me', async () => {
  const unauthenticated = await fetch(`${baseUrl}/auth/me`);
  assert.equal(unauthenticated.status, 401);

  const tokenRes = await fetch(`${baseUrl}/auth/dev-token`, { method: 'POST' });
  const tokenBody = await tokenRes.json();
  const token = tokenBody?.data?.token;

  const authenticated = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(authenticated.status, 200);
});
