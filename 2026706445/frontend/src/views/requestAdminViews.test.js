import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const readSource = (fileName) => readFileSync(resolve(currentDir, fileName), "utf8");

describe("request and admin workflow views", () => {
  it("renders a sent request status view for contact requests and project applications", () => {
    const source = readSource("SentRequestsView.vue");

    expect(source).toContain("getSentContactRequests");
    expect(source).toContain("getSentProjectApplications");
    expect(source).toContain("combinedRequests");
    expect(source).toContain("statusLabels");
  });

  it("renders a project-owner application management view", () => {
    const source = readSource("ProjectApplicationsManageView.vue");

    expect(source).toContain("getOwnedProjectApplications");
    expect(source).toContain("decideProjectApplication");
    expect(source).toContain("handleDecision");
    expect(source).toContain("accepted");
    expect(source).toContain("rejected");
  });

  it("renders admin home and physical card order queue views", () => {
    const homeSource = readSource("AdminHomeView.vue");
    expect(homeSource).toContain("getAdminOverview");
    expect(homeSource).toContain("/admin/members");
    expect(homeSource).toContain("/admin/requests");
    expect(homeSource).toContain("/admin/audit-logs");
    expect(homeSource).toContain("/admin/physical-card-orders");

    const source = readSource("AdminPhysicalCardOrdersView.vue");
    expect(source).toContain("getAdminPhysicalCardOrders");
    expect(source).toContain("updateAdminPhysicalCardOrderStatus");
    expect(source).toContain("statusOptions");
    expect(source).toContain("handleStatusUpdate");
  });

  it("renders admin member, request, and operation log views", () => {
    expect(readSource("AdminMembersView.vue")).toContain("getAdminMembers");
    expect(readSource("AdminMembersView.vue")).toContain("회원 검색");
    expect(readSource("AdminRequestsView.vue")).toContain("getAdminRequests");
    expect(readSource("AdminRequestsView.vue")).toContain("전체 요청 관리");
    expect(readSource("AdminAuditLogsView.vue")).toContain("getAdminAuditLogs");
    expect(readSource("AdminAuditLogsView.vue")).toContain("운영 로그");
  });
});
