import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const rootDir = fileURLToPath(new URL('..', import.meta.url));

let shuttingDown = false;
const children = [];
const managedPorts = [3000, 3001];

function writePrefixed(name, stream, chunk) {
  const lines = chunk.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line) stream.write(`[${name}] ${line}\n`);
  }
}

function stopProcessTree(child, signal = 'SIGTERM') {
  if (!child?.pid) return;
  if (isWindows) {
    spawnSync('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  child.kill(signal);
}

function stopManagedPorts() {
  if (!isWindows) return;
  for (const port of managedPorts) {
    spawnSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `$c = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; ` +
          `$c | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`,
      ],
      { stdio: 'ignore' },
    );
  }
}

function startService({ name, workspace, script }) {
  let child;
  try {
    const args = ['run', script, '--workspace', workspace];
    const command = isWindows ? `${npm} ${args.join(' ')}` : npm;
    child = spawn(command, isWindows ? [] : args, {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      shell: isWindows,
      windowsHide: true,
    });
  } catch (error) {
    console.error(`[dev] Failed to start ${name}: ${error.message}`);
    process.exit(1);
  }

  child.stdout.on('data', (chunk) => writePrefixed(name, process.stdout, chunk));
  child.stderr.on('data', (chunk) => writePrefixed(name, process.stderr, chunk));
  child.on('error', (error) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`[dev] ${name} failed to start: ${error.message}`);
    for (const other of children) stopProcessTree(other);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`[dev] ${name} exited with ${reason}. Stopping remaining services.`);
    for (const other of children) {
      if (other !== child) stopProcessTree(other);
    }
    stopManagedPorts();
    process.exit(code ?? 1);
  });

  children.push(child);
  return child;
}

async function waitForUrl(url, label, timeoutMs = 90000) {
  const startedAt = Date.now();
  let lastError = '';

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        console.log(`[dev] ${label} ready at ${url}`);
        return;
      }
      lastError = `HTTP ${res.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  shuttingDown = true;
  console.error(`[dev] ${label} did not become ready at ${url}. Last error: ${lastError}`);
  console.error('[dev] Stopping dev servers so the frontend cannot run with a disconnected API.');
  for (const child of children) stopProcessTree(child);
  process.exit(1);
}

function stopDevServers(message) {
  shuttingDown = true;
  console.error(message);
  for (const child of children) stopProcessTree(child);
  stopManagedPorts();
  process.exit(1);
}

async function checkUrl(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function main() {
  console.log('[dev] Clearing managed dev ports 3000 and 3001 before startup.');
  stopManagedPorts();

  console.log('[dev] Starting API first. Web will start only after http://localhost:3001/api is ready.');
  startService({ name: 'api', workspace: 'apps/api', script: 'dev' });
  await waitForUrl('http://localhost:3001/api', 'api');

  console.log('[dev] Starting web after API readiness check passed.');
  startService({ name: 'web', workspace: 'apps/web', script: 'dev:next' });
  await waitForUrl('http://localhost:3000', 'web');

  const failureGraceMs = 15_000;
  let firstFailureAt = null;

  setInterval(async () => {
    if (shuttingDown) return;
    try {
      await checkUrl('http://localhost:3001/api');
      firstFailureAt = null;
    } catch (error) {
      firstFailureAt ??= Date.now();
      const elapsed = Date.now() - firstFailureAt;
      console.warn(`[dev] api health check failed (${error.message}); waiting ${Math.ceil((failureGraceMs - elapsed) / 1000)}s before stopping.`);
      if (elapsed >= failureGraceMs) {
        stopDevServers(`[dev] api stayed unavailable at http://localhost:3001/api for ${Math.round(elapsed / 1000)}s. Last error: ${error.message}`);
      }
    }
  }, 5000);
}

main().catch((error) => {
  stopDevServers(`[dev] API readiness check failed: ${error.message}`);
});

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    stopProcessTree(child, signal);
  }
  stopManagedPorts();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
