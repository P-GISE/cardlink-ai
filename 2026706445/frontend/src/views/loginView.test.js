import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const loginViewSource = readFileSync(resolve(currentDir, "LoginView.vue"), "utf8");

describe("LoginView", () => {
  it("opens a production-ready email signup panel before submitting signup", () => {
    expect(loginViewSource).toContain('authMode = ref("login")');
    expect(loginViewSource).toContain('setAuthMode("signup")');
    expect(loginViewSource).toContain('authMode === "login"');
    expect(loginViewSource).toContain('@submit.prevent="handleLoginSubmit"');
    expect(loginViewSource).toContain('@submit.prevent="handleSignupSubmit"');
    expect(loginViewSource).toContain("signupFullName");
    expect(loginViewSource).toContain("비밀번호 확인");
    expect(loginViewSource).toContain('autocomplete="new-password"');
    expect(loginViewSource).toContain("privacyAccepted");
    expect(loginViewSource).toContain("termsAccepted");
    expect(loginViewSource).toContain("validateSignupForm");
    expect(loginViewSource).toContain("signUpWithPassword");
    expect(loginViewSource).not.toContain('name="authAction"');
    expect(loginViewSource).not.toContain("event.submitter?.value");
  });
});
