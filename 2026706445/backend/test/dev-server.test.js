import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const backendRoot = new URL("..", import.meta.url);

const waitForJson = async (url, options = {}) => {
  let lastError;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`Unexpected status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  throw lastError;
};

test("dev server script starts local fallback API without Supabase env", async () => {
  const port = "4307";
  const child = spawn(process.execPath, ["scripts/dev-server.mjs"], {
    cwd: backendRoot,
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: "development",
      ENABLE_LOCAL_AUTH: "",
      CORS_ORIGIN: "",
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  let exited = false;
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.on("exit", () => {
    exited = true;
  });

  try {
    const healthResponse = await waitForJson(`http://127.0.0.1:${port}/api/health`);
    assert.equal(healthResponse.status, 200);

    const projectsResponse = await waitForJson(`http://127.0.0.1:${port}/api/projects`, {
      headers: {
        Origin: "http://127.0.0.1:5173"
      }
    });
    const projects = await projectsResponse.json();

    assert.equal(projectsResponse.headers.get("access-control-allow-origin"), "http://127.0.0.1:5173");
    assert.ok(projects.count > 0);
  } finally {
    child.kill();
    if (!exited) {
      await once(child, "exit").catch(() => {});
    }
  }

  assert.match(output, /AI card platform API server is running/);
});
