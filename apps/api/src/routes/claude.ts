import { Router, Request, Response } from 'express';
import * as pty from 'node-pty';

const router: Router = Router();

// Configuration
const CONFIG = {
  PROCESS_TIMEOUT: 5 * 60 * 1000, // 5 minutes timeout
  KEEPALIVE_INTERVAL: 25000, // 25 seconds keepalive interval
};

// Store active PTY processes
const activeProcesses = new Map<string, pty.IPty>();

// POST /api/claude/execute - Execute a Claude Code command using PTY
router.post('/execute', async (req, res) => {
  const { prompt, workingDir } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Prompt is required' }
    });
  }

  // Validate and resolve working directory
  let workingDirectory = workingDir && workingDir.trim() ? workingDir : process.cwd();

  // Check if directory exists
  const fs = await import('fs');
  if (!fs.existsSync(workingDirectory)) {
    console.log(`[Claude PTY] Directory not found: ${workingDirectory}, using current directory`);
    workingDirectory = process.cwd();
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.flushHeaders();

  // Generate unique process ID
  const processId = `claude-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Send initial message
  const send = (obj: any) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  send({ type: 'connected', content: `Starting Claude Code in PTY (PID: ${processId})...`, workingDir: workingDirectory });

  console.log(`[Claude PTY] ===== START =====`);
  console.log(`[Claude PTY] Process ID: ${processId}`);
  console.log(`[Claude PTY] Working directory: ${workingDirectory}`);
  console.log(`[Claude PTY] Prompt: ${prompt.substring(0, 100)}...`);

  let keepaliveTimer: NodeJS.Timeout | null = null;
  let isFinished = false;
  let timeoutTimer: NodeJS.Timeout | null = null;

  try {
    // Use PowerShell as the shell
    const shell = 'powershell.exe';
    const shellArgs = ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass'];

    console.log(`[Claude PTY] Spawning PTY with: ${shell} ${shellArgs.join(' ')}`);

    // Spawn PTY
    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: workingDirectory,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        // Force UTF-8 encoding for better compatibility
        FORCE_COLOR: '0',
      } as { [key: string]: string },
    });

    // Store the process
    activeProcesses.set(processId, ptyProcess);

    console.log(`[Claude PTY] PTY spawned with PID: ${ptyProcess.pid}`);

    // Keepalive timer
    keepaliveTimer = setInterval(() => {
      if (!isFinished && !res.writableEnded) {
        send({ type: 'keepalive', timestamp: Date.now() });
      }
    }, CONFIG.KEEPALIVE_INTERVAL);

    // Timeout timer
    timeoutTimer = setTimeout(() => {
      if (!isFinished) {
        console.log(`[Claude PTY] Timeout, killing process`);
        send({ type: 'error', content: 'Process timeout - killing process' });
        try {
          ptyProcess.kill();
        } catch (e) {
          console.error(`[Claude PTY] Error killing process: ${e}`);
        }
      }
    }, CONFIG.PROCESS_TIMEOUT);

    // PTY only has one 'data' event - no separate stdout/stderr
    ptyProcess.onData((data: string) => {
      console.log(`[Claude PTY] Received ${data.length} bytes`);
      
      // Send raw data to client
      send({ type: 'chunk', data });
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`[Claude PTY] Process exited: code=${exitCode}, signal=${signal}`);
      
      if (isFinished) return;
      isFinished = true;

      // Clear timers
      if (keepaliveTimer) {
        clearInterval(keepaliveTimer);
        keepaliveTimer = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }

      // Clean up
      activeProcesses.delete(processId);

      send({ type: 'exit', exitCode, signal });
      res.end();
    });

    // Wait a bit for PTY to initialize, then set up UTF-8 encoding
    setTimeout(() => {
      // Set PowerShell to UTF-8
      ptyProcess.write('[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\r\n');
      ptyProcess.write('$OutputEncoding = [Console]::OutputEncoding\r\n');
      ptyProcess.write('chcp 65001 > $null\r\n');
      
      // Change to working directory
      const cdCmd = `Set-Location '${workingDirectory.replace(/'/g, "''")}'\r\n`;
      ptyProcess.write(cdCmd);

      // Execute claude command
      // Use -p flag for prompt mode, and escape the prompt properly
      const escapedPrompt = prompt.replace(/'/g, "''").replace(/\r?\n/g, ' ');
      const claudeCmd = `claude -p --verbose --output-format json -- ${escapedPrompt}\r\n`;
      
      console.log(`[Claude PTY] Executing: ${claudeCmd.substring(0, 100)}...`);
      ptyProcess.write(claudeCmd);
    }, 500);

    // Handle client disconnect
    req.on('close', () => {
      console.log(`[Claude PTY] Client disconnected, killing process`);
      
      if (keepaliveTimer) {
        clearInterval(keepaliveTimer);
        keepaliveTimer = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }

      if (!isFinished) {
        activeProcesses.delete(processId);
        try {
          ptyProcess.kill();
        } catch (e) {
          console.error(`[Claude PTY] Error killing process on disconnect: ${e}`);
        }
      }
    });

  } catch (error: any) {
    console.error(`[Claude PTY] Error: ${error.message}`);
    console.error(error.stack);

    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
    }
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }

    send({ type: 'error', content: `Server error: ${error.message}` });
    res.end();
  }
});

// POST /api/claude/execute-simple - Simple claude execution without PTY (fallback)
router.post('/execute-simple', async (req, res) => {
  const { prompt, workingDir } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Prompt is required' }
    });
  }

  // Validate and resolve working directory
  let workingDirectory = workingDir && workingDir.trim() ? workingDir : process.cwd();

  const fs = await import('fs');
  if (!fs.existsSync(workingDirectory)) {
    workingDirectory = process.cwd();
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (obj: any) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  send({ type: 'connected', content: 'Starting Claude Code (simple mode)...' });

  // Simple spawn fallback
  const { spawn } = await import('child_process');
  
  const escapedWorkingDir = workingDirectory.replace(/'/g, "''");
  const psArgs = [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    `Set-Location '${escapedWorkingDir}'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [Console]::OutputEncoding; claude -p --verbose --output-format json -- "${prompt.replace(/"/g, '\\"')}"`
  ];

  console.log(`[Claude Simple] Spawning: powershell.exe ${psArgs.join(' ')}`);

  const claude = spawn('powershell.exe', psArgs, {
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let isFinished = false;
  let hasOutput = false;

  claude.stdout.on('data', (data) => {
    hasOutput = true;
    const msg = data.toString();
    console.log(`[Claude Simple] stdout: ${msg.length} bytes`);
    send({ type: 'chunk', data: msg });
  });

  claude.stderr.on('data', (data) => {
    const msg = data.toString();
    console.log(`[Claude Simple] stderr: ${msg.length} bytes`);
    if (msg.trim()) {
      send({ type: 'error', content: msg });
    }
  });

  claude.on('close', (code) => {
    if (isFinished) return;
    isFinished = true;
    
    console.log(`[Claude Simple] Process closed: code=${code}, hasOutput=${hasOutput}`);
    
    if (!hasOutput && code !== 0) {
      send({ type: 'error', content: `Process exited with code ${code}` });
    }
    send({ type: 'done', code });
    res.end();
  });

  claude.on('error', (err) => {
    console.error(`[Claude Simple] Error: ${err.message}`);
    send({ type: 'error', content: err.message });
    res.end();
  });

  req.on('close', () => {
    if (!isFinished) {
      claude.kill('SIGTERM');
    }
  });
});

// GET /api/claude/health - Check Claude Code availability
router.get('/health', async (req, res) => {
  try {
    console.log(`[Claude API] Health check requested`);
    const { execSync } = await import('child_process');
    const version = execSync('claude --version', {
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true
    });

    console.log(`[Claude API] Health check OK: ${version.trim()}`);

    res.json({
      ok: true,
      version: version.trim(),
      message: 'Claude Code is available'
    });
  } catch (error: any) {
    console.error(`[Claude API] Health check failed: ${error.message}`);
    res.status(503).json({
      ok: false,
      error: 'Claude Code not found',
      message: 'Please install Claude Code from https://claude.com/claude-code'
    });
  }
});

// GET /api/claude/test-pty - Test PTY functionality
router.get('/test-pty', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (obj: any) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  send({ type: 'connected', content: 'Testing PTY...' });

  try {
    const ptyProcess = pty.spawn('powershell.exe', ['-NoLogo', '-NoProfile'], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      } as { [key: string]: string },
    });

    send({ type: 'info', content: `PTY spawned with PID: ${ptyProcess.pid}` });

    let outputBuffer = '';

    ptyProcess.onData((data: string) => {
      outputBuffer += data;
      send({ type: 'chunk', data });
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      send({ type: 'exit', exitCode, signal, outputLength: outputBuffer.length });
      res.end();
    });

    // Run some test commands
    setTimeout(() => {
      ptyProcess.write('Write-Host "Hello from PTY!" -ForegroundColor Green\r\n');
    }, 300);

    setTimeout(() => {
      ptyProcess.write('$PSVersionTable.PSVersion\r\n');
    }, 600);

    setTimeout(() => {
      ptyProcess.write('where.exe claude\r\n');
    }, 900);

    setTimeout(() => {
      ptyProcess.write('exit\r\n');
    }, 2000);

    // Timeout
    setTimeout(() => {
      ptyProcess.kill();
    }, 5000);

  } catch (error: any) {
    send({ type: 'error', content: error.message });
    res.end();
  }
});

export default router;
