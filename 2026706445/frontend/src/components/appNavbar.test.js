import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const navbarSource = readFileSync(resolve(currentDir, "AppNavbar.vue"), "utf8");

describe("AppNavbar", () => {
  it("renders auth-aware navigation with a logout action", () => {
    expect(navbarSource).toContain("isAuthenticated");
    expect(navbarSource).toContain("handleSignOut");
    expect(navbarSource).toContain("isMenuOpen");
    expect(navbarSource).toContain("isWorkRouteActive");
    expect(navbarSource).toContain("accountMenu");
    expect(navbarSource).toContain("closeMenu");
    expect(navbarSource).toContain("nav-menu-toggle");
    expect(navbarSource).toContain("nav-primary");
    expect(navbarSource).toContain("nav-account-menu");
    expect(navbarSource).toContain("내 작업");
    expect(navbarSource).toContain('to: "/contacts"');
    expect(navbarSource).toContain('to: "/requests/sent"');
    expect(navbarSource).toContain('to: "/projects/manage"');
    expect(navbarSource).toContain('to: "/admin"');
    expect(navbarSource).toContain("컨택 요청");
    expect(navbarSource).toContain("로그아웃");
  });

  it("keeps public discovery links separate from authenticated work links", () => {
    expect(navbarSource).toContain("publicLinks");
    expect(navbarSource).toContain("workLinks");
    expect(navbarSource).toContain("adminLinks");
    expect(navbarSource).toContain("실물 명함 만들기");
    expect(navbarSource).toContain("전자명함 만들기");
  });
});
