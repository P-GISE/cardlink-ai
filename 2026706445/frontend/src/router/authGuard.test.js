import { describe, expect, it } from "vitest";
import { routes } from "./index.js";
import { resolveAuthRedirect } from "./authGuard.js";

describe("auth route guard", () => {
  it("marks electronic business card creation routes as auth-only", () => {
    expect(routes.find((route) => route.name === "profile").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "profile-edit").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "physical-card-builder").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "physical-card-order").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "physical-card-orders").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "contact-requests").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "sent-requests").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "project-applications-manage").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "admin-home").meta.requiresAuth).toBe(true);
    expect(routes.find((route) => route.name === "admin-physical-card-orders").meta.requiresAuth).toBe(true);
  });

  it("redirects anonymous users to login before electronic business card creation", async () => {
    const redirect = await resolveAuthRedirect(
      { fullPath: "/profile", meta: { requiresAuth: true } },
      async () => null
    );

    expect(redirect).toEqual({
      name: "login",
      query: { redirect: "/profile" }
    });
  });

  it("allows authenticated users into electronic business card creation", async () => {
    const result = await resolveAuthRedirect(
      { fullPath: "/profile", meta: { requiresAuth: true } },
      async () => "local-dev-token"
    );

    expect(result).toBe(true);
  });

  it("exposes public profile detail routes for shared QR URLs", () => {
    const route = routes.find((item) => item.name === "public-profile");

    expect(route.path).toBe("/profiles/:slug");
    expect(route.meta?.requiresAuth).toBeUndefined();
  });
});
