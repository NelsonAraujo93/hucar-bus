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
let output = '';

/**
 * Diagnostics only. The readiness check deliberately does not read this: Vite
 * bolds the port number, so the URL line contains an escape sequence between
 * "localhost:" and the port and a literal substring match never fires. That is
 * invisible locally, where piped stdio disables colour, and breaks in CI, where
 * FORCE_COLOR is set.
 */
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*[a-zA-Z]', 'g');
const plainOutput = () => output.replace(ANSI, '');

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

/**
 * Waits by asking the server for a response, not by reading what it printed.
 * Output formatting is not a contract; a listening socket is.
 */
async function waitForServer() {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`dev server exited early with code ${server.exitCode}\n${plainOutput()}`);
    }

    try {
      await fetch(`http://localhost:${PORT}/`, { signal: AbortSignal.timeout(2_000) });
      return;
    } catch {
      // Not listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`dev server did not start within ${STARTUP_TIMEOUT_MS}ms\n${plainOutput()}`);
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

const capture = (chunk) => {
  output += chunk.toString();
};
server.stdout.on('data', capture);
server.stderr.on('data', capture);

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
