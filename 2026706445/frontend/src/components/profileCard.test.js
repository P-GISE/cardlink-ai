import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(currentDir, "ProfileCard.vue"), "utf8");

describe("ProfileCard", () => {
  it("sanitizes external contact links before rendering anchors", () => {
    expect(source).toContain("normalizeExternalUrl");
    expect(source).toContain("contactLinks.website");
    expect(source).not.toContain(':href="profile.contact.website"');
  });
});
