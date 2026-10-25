import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({}) }));

const load = async () => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "https://synthetic.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "synthetic-public-key");
  return import("./supabase.js");
};

afterEach(() => vi.unstubAllEnvs());

describe("configured OAuth availability", () => {
  it("enables only explicitly enabled supported providers", async () => {
    const { getEnabledOAuthProviders } = await load();
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ external: { google: true, github: false, email: true, other: true } })
    });
    expect(await getEnabledOAuthProviders(request)).toEqual(["google"]);
    expect(request).toHaveBeenCalledWith("https://synthetic.supabase.co/auth/v1/settings", {
      headers: { apikey: "synthetic-public-key" }
    });
  });

  it("keeps social login unavailable for disabled, failed or malformed settings", async () => {
    const { getEnabledOAuthProviders } = await load();
    for (const response of [
      { ok: true, json: async () => ({ external: { google: false, github: false } }) },
      { ok: true, json: async () => ({ external: { google: "true" } }) },
      { ok: true, json: async () => ({}) },
      { ok: false }
    ]) {
      expect(await getEnabledOAuthProviders(async () => response)).toEqual([]);
    }
    expect(await getEnabledOAuthProviders(async () => { throw new Error("offline"); })).toEqual([]);
  });

  it("does not make a request without public Supabase configuration", async () => {
    const { getEnabledOAuthProviders } = await load();
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.resetModules();
    const unconfigured = await import("./supabase.js");
    const request = vi.fn();
    expect(await unconfigured.getEnabledOAuthProviders(request)).toEqual([]);
    expect(request).not.toHaveBeenCalled();
    expect(getEnabledOAuthProviders).toBeTypeOf("function");
  });
});
