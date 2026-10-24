import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";

const production = {
  NODE_ENV: "production",
  CORS_ORIGIN: "https://cardlink.example.test",
  SUPABASE_URL: "https://synthetic.invalid",
  SUPABASE_ANON_KEY: "synthetic-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-server-secret"
};

test("production requires explicit CORS origin", () => {
  for (const CORS_ORIGIN of [undefined, "", "  ", ","]) {
    assert.throws(() => loadEnv({ ...production, CORS_ORIGIN }), /CORS_ORIGIN is required/);
  }
});

test("production serves SPA and API on one origin without demo authentication", async () => {
  const staticDir = mkdtempSync(join(tmpdir(), "cardlink-static-"));
  try {
    writeFileSync(join(staticDir, "index.html"), "<!doctype html><title>Cardlink fixture</title>");
    writeFileSync(join(staticDir, "asset.js"), "console.log('fixture')");
    const app = createApp({ env: loadEnv(production), staticDir, logger: false });
    await request(app).get("/").expect(200).expect(/Cardlink fixture/);
    await request(app).get("/auth/callback").expect(200).expect(/Cardlink fixture/);
    await request(app).get("/asset.js").expect(200);
    await request(app).get("/missing.js").expect(404);
    await request(app).get("/api/unknown").expect(404).expect("Content-Type", /json/);
    await request(app).get("/api/me").expect(401);
    const health = await request(app).get("/api/health").set("Origin", production.CORS_ORIGIN).expect(200);
    assert.equal(health.body.status, "ok");
    assert.equal(health.headers["access-control-allow-origin"], production.CORS_ORIGIN);
    assert.match(health.headers["content-security-policy"], /connect-src 'self' https:\/\/synthetic.invalid/);
    const blocked = await request(app).get("/api/health").set("Origin", "https://unapproved.invalid").expect(500);
    assert.equal(blocked.headers["access-control-allow-origin"], undefined);
  } finally {
    rmSync(staticDir, { recursive: true, force: true });
  }
});
