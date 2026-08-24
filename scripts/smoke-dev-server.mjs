/**
 * Smoke-tests the development server.
 *
 * Every other check in this repository inspects the production build. That is
 * how the dev server came to return 404 for the entire site -- no route matched
 * '' and public-root/ was never served -- while CI stayed green. Development is
 * what the team uses all day, so it gets its own check.
 *
 * Starts `ng serve`, waits for it to report a URL, probes the paths that matter,
 * and always shuts the server down.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const PORT = 4399;
const STARTUP_TIMEOUT_MS = 180_000;
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * `body` is a substring the response must contain. Status and content type
 * alone would pass on an error page rendered with a 200.
 */
const CHECKS = [
  { path: '/', status: 200, type: 'text/html', body: '<hb-root' },
  { path: '/ui', status: 200, type: 'text/html', body: '<hb-root' },
  { path: '/logo.jpeg', status: 200, type: 'image/jpeg' },
  { path: '/favicon.ico', status: 200 },
  { path: '/robots.txt', status: 200, type: 'text/plain', body: 'User-agent' },
];

let server;

function shutdown() {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
  }
}

process.on('exit', shutdown);
process.on('SIGINT', () => {
  shutdown();
  process.exit(130);
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => {
      reject(new Error(`dev server did not start within ${STARTUP_TIMEOUT_MS}ms\n${output}`));
    }, STARTUP_TIMEOUT_MS);

    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes(`localhost:${PORT}`)) {
        clearTimeout(timer);
        resolve();
      }
    };

    server.stdout.on('data', onData);
    server.stderr.on('data', onData);
    server.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`dev server exited early with code ${code}\n${output}`));
    });
  });
}

async function probe(check) {
  const response = await fetch(`http://localhost:${PORT}${check.path}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const problems = [];
  if (response.status !== check.status) {
    problems.push(`expected status ${check.status}, got ${response.status}`);
  }

  const type = response.headers.get('content-type') ?? '';
  if (check.type !== undefined && !type.includes(check.type)) {
    problems.push(`expected content-type ${check.type}, got ${type || '(none)'}`);
  }

  if (check.body !== undefined) {
    const text = await response.text();
    if (!text.includes(check.body)) {
      problems.push(`response body does not contain ${JSON.stringify(check.body)}`);
    }
  }

  return problems;
}

console.log(`Starting dev server on port ${PORT}...`);
const cli = createRequire(import.meta.url).resolve('@angular/cli/bin/ng.js');
server = spawn(process.execPath, [cli, 'serve', '--port', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer();
} catch (error) {
  console.error(`Dev server smoke test failed to start:\n${error.message}`);
  shutdown();
  process.exit(1);
}

const failures = [];
for (const check of CHECKS) {
  let problems;
  try {
    problems = await probe(check);
  } catch (error) {
    problems = [`request failed: ${error.message}`];
  }

  if (problems.length === 0) {
    console.log(`  ok   ${check.path}`);
  } else {
    console.log(`  FAIL ${check.path}`);
    failures.push(...problems.map((p) => `${check.path}: ${p}`));
  }
}

shutdown();

if (failures.length > 0) {
  console.error(`\nDev server smoke test failed:\n`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`\nDev server OK: ${CHECKS.length} paths served correctly.`);
