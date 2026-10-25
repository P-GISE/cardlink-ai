import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";

const createAppForHealth = () =>
  createApp({
    logger: false,
    env: {
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase: {
      from() {
        throw new Error("health should not hit database");
      }
    },
    supabaseAuth: { auth: { getUser: async () => ({ data: { user: null }, error: null }) } }
  });

test("GET /api/health returns operational status", async () => {
  const response = await request(createAppForHealth()).get("/api/health").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.service, "ai-card-platform-api");
  assert.equal(response.headers["x-powered-by"], undefined);
});

test("unknown API paths return JSON 404", async () => {
  const response = await request(createAppForHealth()).get("/api/unknown").expect(404);

  assert.equal(response.body.message, "API route not found.");
  assert.equal(response.body.path, "/api/unknown");
});

test("local CORS allows localhost and 127.0.0.1 Vite origins", async () => {
  const app = createApp({
    logger: false,
    env: loadEnv({ NODE_ENV: "development", ENABLE_LOCAL_AUTH: "true" })
  });

  const localhostResponse = await request(app)
    .get("/api/health")
    .set("Origin", "http://localhost:5173")
    .expect(200);
  const loopbackResponse = await request(app)
    .get("/api/health")
    .set("Origin", "http://127.0.0.1:5173")
    .expect(200);

  assert.equal(localhostResponse.headers["access-control-allow-origin"], "http://localhost:5173");
  assert.equal(loopbackResponse.headers["access-control-allow-origin"], "http://127.0.0.1:5173");
});

test("development CORS allows localhost Vite fallback ports", async () => {
  const app = createApp({
    logger: false,
    env: loadEnv({ NODE_ENV: "development", ENABLE_LOCAL_AUTH: "true" })
  });

  const response = await request(app)
    .get("/api/projects")
    .set("Origin", "http://127.0.0.1:5312")
    .expect(200);

  assert.equal(response.headers["access-control-allow-origin"], "http://127.0.0.1:5312");
});

test("oversized JSON bodies are rejected before route handlers run", async () => {
  const largePayload = {
    slug: "large-profile",
    displayName: "Large Profile",
    bio: "x".repeat(70 * 1024)
  };

  const response = await request(createAppForHealth())
    .post("/api/me/profile")
    .set("Authorization", "Bearer token")
    .send(largePayload)
    .expect(413);

  assert.equal(response.body.message, "Request body is too large.");
});

test("API rate limit returns 429 after the configured request budget", async () => {
  const app = createApp({
    logger: false,
    env: {
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      requestBodyLimit: "32kb",
      rateLimit: { windowMs: 60_000, max: 2 },
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase: {
      from() {
        throw new Error("health should not hit database");
      }
    },
    supabaseAuth: { auth: { getUser: async () => ({ data: { user: null }, error: null }) } }
  });

  await request(app).get("/api/unknown").expect(404);
  await request(app).get("/api/unknown").expect(404);

  const response = await request(app).get("/api/unknown").expect(429);

  assert.equal(response.body.message, "Too many requests. Please try again later.");
  assert.equal(response.headers["retry-after"], "60");
  await request(app).get("/api/health").expect(200);
});

test("trusted ingress keeps separate client budgets and ignores a spoofed leftmost address", async () => {
  const app = createApp({
    logger: false,
    env: {
      corsOrigins: ["https://cardlink.example"], nodeEnv: "test",
      trustedProxyIps: ["127.0.0.1", "::1"],
      rateLimit: { windowMs: 60_000, max: 1 },
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase: { from() { throw new Error("unknown routes must not access data"); } },
    supabaseAuth: { auth: { getUser: async () => ({ data: { user: null }, error: null }) } }
  });
  await request(app).get("/api/unknown").set("X-Forwarded-For", "198.51.100.10").expect(404);
  await request(app).get("/api/unknown").set("X-Forwarded-For", "198.51.100.11").expect(404);
  await request(app).get("/api/unknown")
    .set("X-Forwarded-For", "203.0.113.20, 198.51.100.10").expect(429);
  assert.equal(app.get("trust proxy fn")("203.0.113.20"), false);
});

test("production error responses do not expose internal exception messages", async () => {
  const app = createApp({
    logger: false,
    env: {
      corsOrigins: ["https://cardlink.example"],
      nodeEnv: "production",
      requestBodyLimit: "32kb",
      rateLimit: { windowMs: 60_000, max: 20 },
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase: {
      from() {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY leaked in stack");
      }
    },
    supabaseAuth: { auth: { getUser: async () => ({ data: { user: null }, error: null }) } }
  });

  const response = await request(app).get("/api/profiles").expect(500);

  assert.equal(response.body.message, "Server error.");
  assert.equal(response.body.detail, undefined);
  assert.equal(response.body.details, undefined);
});
