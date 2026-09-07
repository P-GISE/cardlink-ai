import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(currentDir, "..");

describe("index.html", () => {
  it("declares a favicon asset to avoid browser 404 noise", () => {
    const source = readFileSync(resolve(frontendRoot, "index.html"), "utf8");

    expect(source).toContain('rel="icon"');
    expect(source).toContain('/favicon.svg');
    expect(existsSync(resolve(frontendRoot, "public", "favicon.svg"))).toBe(true);
  });
});
