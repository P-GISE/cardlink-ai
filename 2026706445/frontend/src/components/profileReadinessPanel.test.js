import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(currentDir, "ProfileReadinessPanel.vue"), "utf8");

describe("ProfileReadinessPanel", () => {
  it("renders a profile readiness checklist and score", () => {
    expect(source).toContain("공개 준비도");
    expect(source).toContain("readiness.score");
    expect(source).toContain("readiness.items");
    expect(source).toContain("checklist-item");
  });
});
