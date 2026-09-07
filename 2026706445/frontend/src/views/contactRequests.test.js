import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const readSource = (fileName) => readFileSync(resolve(currentDir, fileName), "utf8");

describe("contact request management", () => {
  it("connects received contact requests to authenticated API flow", () => {
    const viewSource = readSource("ContactRequestsView.vue");

    expect(viewSource).toContain("getAccessToken");
    expect(viewSource).toContain("getContactRequests");
    expect(viewSource).toContain("decideContactRequest");
    expect(viewSource).toContain("statusFilter");
    expect(viewSource).toContain("filteredRequests");
    expect(viewSource).toContain("handleDecision");
    expect(viewSource).toContain("updatingId");
    expect(viewSource).toContain("받은 컨택 요청");
    expect(viewSource).toContain("전체");
    expect(viewSource).toContain("대기");
    expect(viewSource).toContain("승인");
    expect(viewSource).toContain("거절");
  });
});
