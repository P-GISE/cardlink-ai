import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const authCallbackSource = readFileSync(resolve(currentDir, "AuthCallbackView.vue"), "utf8");

describe("AuthCallbackView", () => {
  it("completes real Supabase auth callbacks before redirecting", () => {
    expect(authCallbackSource).toContain("completeAuthCallback");
    expect(authCallbackSource).toContain("result.redirectPath");
    expect(authCallbackSource).toContain("인증 링크를 확인하고 있습니다.");
    expect(authCallbackSource).not.toContain('router.replace("/profile/edit")');
  });
});
