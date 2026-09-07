import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const routerSource = readFileSync(resolve(currentDir, "index.js"), "utf8");

describe("admin routes", () => {
  it("registers expanded admin console pages behind auth", () => {
    expect(routerSource).toContain("AdminMembersView");
    expect(routerSource).toContain("AdminRequestsView");
    expect(routerSource).toContain("AdminAuditLogsView");
    expect(routerSource).toContain('path: "/admin/members"');
    expect(routerSource).toContain('path: "/admin/requests"');
    expect(routerSource).toContain('path: "/admin/audit-logs"');
    expect(routerSource).toContain('meta: { requiresAuth: true }');
  });
});
