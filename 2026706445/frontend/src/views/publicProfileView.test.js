import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(currentDir, "PublicProfileView.vue"), "utf8");

describe("PublicProfileView", () => {
  it("loads a public profile by slug and renders the business card", () => {
    expect(source).toContain("useRoute");
    expect(source).toContain("getProfileBySlug");
    expect(source).toContain("ProfileCard");
    expect(source).toContain("SharePanel");
    expect(source).toContain("route.params.slug");
  });
});
