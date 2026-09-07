import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../src/config/env.js";

test("loadEnv returns defaults for local optional values", () => {
  const env = loadEnv({
    PORT: "5000",
    NODE_ENV: "test",
    CORS_ORIGIN: "http://localhost:5173",
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key"
  });

  assert.equal(env.port, 5000);
  assert.equal(env.nodeEnv, "test");
  assert.deepEqual(env.corsOrigins, ["http://localhost:5173"]);
  assert.equal(env.supabase.url, "https://project.supabase.co");
  assert.equal(env.supabase.anonKey, "anon-key");
  assert.equal(env.supabase.serviceRoleKey, "service-role-key");
});

test("loadEnv fails when Supabase values are missing", () => {
  assert.throws(
    () =>
      loadEnv({
        NODE_ENV: "production",
        CORS_ORIGIN: "https://app.example.test"
      }),
    /Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY/
  );
});

test("loadEnv rejects local auth fallback unless it is explicitly enabled", () => {
  assert.throws(
    () =>
      loadEnv({
        NODE_ENV: "development"
      }),
    /Local auth fallback requires ENABLE_LOCAL_AUTH=true/
  );
});

test("loadEnv allows explicit local development without Supabase values", () => {
  const env = loadEnv({
    NODE_ENV: "development",
    ENABLE_LOCAL_AUTH: "true"
  });

  assert.equal(env.nodeEnv, "development");
  assert.deepEqual(env.corsOrigins, ["http://localhost:5173", "http://127.0.0.1:5173"]);
  assert.equal(env.supabase.isConfigured, false);
  assert.equal(env.supabase.enableLocalAuth, true);
});

test("loadEnv rejects local auth fallback in production", () => {
  assert.throws(
    () =>
      loadEnv({
        NODE_ENV: "production",
        ENABLE_LOCAL_AUTH: "true",
        CORS_ORIGIN: "https://app.example.test",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key"
      }),
    /ENABLE_LOCAL_AUTH must not be enabled in production/
  );
});

test("loadEnv rejects wildcard CORS in production", () => {
  assert.throws(
    () =>
      loadEnv({
        NODE_ENV: "production",
        CORS_ORIGIN: "*",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key"
      }),
    /CORS_ORIGIN must not contain \* in production/
  );
});

test("loadEnv parses production rate limit settings", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    CORS_ORIGIN: "https://app.example.test",
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    RATE_LIMIT_WINDOW_MS: "60000",
    RATE_LIMIT_MAX: "75"
  });

  assert.deepEqual(env.rateLimit, {
    windowMs: 60000,
    max: 75
  });
});
