import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const loadVercelConfig = () =>
  JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));

describe("deployment security headers", () => {
  it("configures browser security headers for all frontend routes", () => {
    const config = loadVercelConfig();
    const routeHeaders = config.headers.find((entry) => entry.source === "/(.*)")?.headers || [];
    const headers = Object.fromEntries(routeHeaders.map((header) => [header.key, header.value]));

    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });
});
