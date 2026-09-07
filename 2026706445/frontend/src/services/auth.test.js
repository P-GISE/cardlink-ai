import { describe, expect, it, vi } from "vitest";
import {
  completeAuthCallback,
  getAccessToken,
  getCurrentUser,
  isAdminUser,
  signInWithPassword,
  signInWithProvider,
  signOut,
  signUpWithPassword
} from "./auth.js";

const createMemoryStorage = () => {
  const store = new Map();

  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key)
  };
};

describe("auth service", () => {
  it("returns access token from current session", async () => {
    const client = {
      auth: {
        getSession: async () => ({
          data: { session: { access_token: "token-1" } }
        })
      }
    };

    await expect(getAccessToken(client)).resolves.toBe("token-1");
  });

  it("starts OAuth provider login", async () => {
    const signInWithOAuth = vi.fn();
    const client = { auth: { signInWithOAuth } };
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", { location: { origin: "http://localhost:5173" } });

    await signInWithProvider(client, "github");

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "github",
      options: {
        redirectTo: "http://localhost:5173/auth/callback?next=%2Fprofile%2Fedit"
      }
    });

    vi.stubGlobal("window", originalWindow);
  });

  it("signs up through Supabase with full name metadata and email confirmation redirect", async () => {
    const signUp = vi.fn(async () => ({ data: { user: { id: "user-1" }, session: null }, error: null }));
    const client = { auth: { signUp } };
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", { location: { origin: "https://cardlink.example.com" } });

    await signUpWithPassword(client, "new@example.com", "password123", {
      fullName: "홍길동",
      termsAcceptedAt: "2026-05-30T00:00:00.000Z",
      privacyAcceptedAt: "2026-05-30T00:00:00.000Z"
    });

    expect(signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
      options: {
        emailRedirectTo: "https://cardlink.example.com/auth/callback?next=%2Fprofile%2Fedit",
        data: {
          full_name: "홍길동",
          terms_accepted_at: "2026-05-30T00:00:00.000Z",
          privacy_accepted_at: "2026-05-30T00:00:00.000Z"
        }
      }
    });

    vi.stubGlobal("window", originalWindow);
  });

  it("exchanges Supabase auth callback codes for a session", async () => {
    const exchangeCodeForSession = vi.fn(async () => ({ error: null }));
    const client = { auth: { exchangeCodeForSession } };

    const result = await completeAuthCallback(
      client,
      "https://cardlink.example.com/auth/callback?code=abc123&next=%2Fprofile%2Fedit"
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(result).toEqual({ error: null, redirectPath: "/profile/edit" });
  });

  it("sanitizes unsafe auth callback redirect paths", async () => {
    const client = {
      auth: {
        exchangeCodeForSession: vi.fn(async () => ({ error: null }))
      }
    };

    await expect(
      completeAuthCallback(client, "https://cardlink.example.com/auth/callback?code=abc123&next=https%3A%2F%2Fevil.example")
    ).resolves.toEqual({ error: null, redirectPath: "/profile/edit" });

    await expect(
      completeAuthCallback(client, "https://cardlink.example.com/auth/callback?code=abc123&next=%2F%2Fevil.example")
    ).resolves.toEqual({ error: null, redirectPath: "/profile/edit" });
  });

  it("verifies Supabase OTP callback links when token hash is provided", async () => {
    const verifyOtp = vi.fn(async () => ({ error: null }));
    const client = { auth: { verifyOtp } };

    const result = await completeAuthCallback(
      client,
      "https://cardlink.example.com/auth/callback?token_hash=token-1&type=signup&next=%2Fprofile%2Fedit"
    );

    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "token-1",
      type: "signup"
    });
    expect(result.redirectPath).toBe("/profile/edit");
  });

  it("reads the current Supabase user", async () => {
    const user = { id: "user-1", email: "real@example.com", user_metadata: { full_name: "홍길동" } };
    const client = {
      auth: {
        getUser: async () => ({ data: { user }, error: null })
      }
    };

    await expect(getCurrentUser(client)).resolves.toEqual(user);
  });

  it("signs out through Supabase", async () => {
    const signOutMock = vi.fn();
    await signOut({ auth: { signOut: signOutMock } });
    expect(signOutMock).toHaveBeenCalled();
  });

  it("creates a local development session when Supabase is not configured", async () => {
    const storage = createMemoryStorage();

    const result = await signUpWithPassword(null, "local@example.test", "password1", { storage });
    const token = await getAccessToken(null, { storage });

    expect(result.error).toBeNull();
    expect(result.local).toBe(true);
    expect(token).toBe("local-dev-token");
  });

  it("creates a local admin development session for admin email accounts", async () => {
    const storage = createMemoryStorage();

    await signUpWithPassword(null, "admin@example.test", "password1", { storage });

    expect(await getAccessToken(null, { storage })).toBe("local-admin-token");
    expect(isAdminUser(await getCurrentUser(null, { storage }))).toBe(true);
  });

  it("rejects local email login when the account was not registered", async () => {
    const storage = createMemoryStorage();

    const result = await signInWithPassword(null, "local@example.test", "password1", { storage });

    expect(result.error.message).toBe("가입된 계정이 없습니다. 먼저 회원가입을 진행해주세요.");
    expect(await getAccessToken(null, { storage })).toBeNull();
  });

  it("signs in locally only after signup with the correct password", async () => {
    const storage = createMemoryStorage();

    await signUpWithPassword(null, "local@example.test", "password1", { storage });
    await signOut(null, { storage });

    const result = await signInWithPassword(null, "local@example.test", "password1", { storage });

    expect(result.error).toBeNull();
    expect(result.local).toBe(true);
    expect(await getAccessToken(null, { storage })).toBe("local-dev-token");
  });

  it("rejects local email login when the password does not match", async () => {
    const storage = createMemoryStorage();

    await signUpWithPassword(null, "local@example.test", "password1", { storage });
    await signOut(null, { storage });

    const result = await signInWithPassword(null, "local@example.test", "wrong-password", { storage });

    expect(result.error.message).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
    expect(await getAccessToken(null, { storage })).toBeNull();
  });

  it("ignores legacy local email sessions that have no registered account", async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      "cardlink.localAuthSession",
      JSON.stringify({
        access_token: "local-dev-token",
        user: { id: "local-user", email: "legacy@example.test" },
        provider: "email"
      })
    );

    expect(await getAccessToken(null, { storage })).toBeNull();
  });

  it("clears local development session on sign out", async () => {
    const storage = createMemoryStorage();

    await signUpWithPassword(null, "local@example.test", "password1", { storage });
    await signOut(null, { storage });

    expect(await getAccessToken(null, { storage })).toBeNull();
  });
});
