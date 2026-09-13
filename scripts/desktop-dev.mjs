import { spawn } from "node:child_process";
import http from "node:http";

const PORT = process.env.RUNLOOP_DEV_PORT ?? "3200";
const URL = `http://localhost:${PORT}`;

function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode >= 200 && res.statusCode < 500) return resolve();
        retry();
      });
      req.on("error", retry);
      req.setTimeout(2000, () => req.destroy());
    };
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error(`Timed out waiting for ${url}`));
      setTimeout(attempt, 500);
    };
    attempt();
  });
}

async function main() {
  console.log(`Starting Next.js dev server on ${URL} ...`);
  const next = spawn("npx", ["next", "dev", "--port", PORT], {
    stdio: "inherit",
    env: { ...process.env },
  });

  const cleanup = () => {
    if (!next.killed) next.kill("SIGTERM");
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);

  try {
    await waitForServer(URL);
  } catch (err) {
    console.error(err.message);
    next.kill("SIGTERM");
    process.exit(1);
  }

  console.log("Launching Electron...");
  const electron = spawn("electron", [".", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, RUNLOOP_DEV_URL: URL },
  });

  electron.on("exit", (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

main();