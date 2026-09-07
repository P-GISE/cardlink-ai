import { describe, expect, it, vi } from "vitest";
import {
  applyToProject,
  buildApiUrl,
  createMyProject,
  createRecommendationRun,
  createPhysicalCardOrder,
  decideContactRequest,
  decideProjectApplication,
  getContactRequests,
  getAdminAuditLogs,
  getAdminMembers,
  getAdminOverview,
  getAdminPhysicalCardOrders,
  getAdminRequests,
  getMyProjects,
  getOwnedProjectApplications,
  getPhysicalCardOrders,
  getSentContactRequests,
  getSentProjectApplications,
  postJson,
  requestContact,
  requestJson,
  updateAdminMemberPublication,
  updateAdminPhysicalCardOrderStatus,
  updateMyProject
} from "./api.js";

describe("buildApiUrl", () => {
  it("builds a plain API URL without query parameters", () => {
    expect(buildApiUrl("/profiles")).toBe("http://127.0.0.1:4000/api/profiles");
  });

  it("adds query parameters and skips empty values", () => {
    expect(buildApiUrl("/projects", { skill: "Vue", empty: "" })).toBe(
      "http://127.0.0.1:4000/api/projects?skill=Vue"
    );
  });
});

describe("requestJson", () => {
  it("adds bearer token when provided", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true })
    }));

    await requestJson("/me", {}, { token: "session-token", fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/me", {
      headers: {
        Authorization: "Bearer session-token"
      }
    });
  });

  it("uses backend error messages when a request fails", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ message: "전자명함 프로필을 먼저 생성해야 합니다." })
    }));

    await expect(requestJson("/me/projects", {}, { token: "session-token", fetchImpl: fetchMock })).rejects.toThrow(
      "전자명함 프로필을 먼저 생성해야 합니다."
    );
  });
});

describe("postJson", () => {
  it("sends JSON body with bearer token", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: "created" })
    }));

    const result = await postJson(
      "/projects/project-1/applications",
      { message: "hello" },
      { token: "session-token", fetchImpl: fetchMock }
    );

    expect(result).toEqual({ id: "created" });
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/projects/project-1/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer session-token"
      },
      body: JSON.stringify({ message: "hello" })
    });
  });
});

describe("interaction helpers", () => {
  it("posts project applications to the backend", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "pending" })
    }));

    await applyToProject("session-token", "project-1", { message: "join" }, { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/projects/project-1/applications",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("posts contact requests to the backend", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "pending" })
    }));

    await requestContact("session-token", "target", { message: "connect" }, { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/profiles/target/contact-requests",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("patches contact request decisions", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "approved" })
    }));

    await decideContactRequest("session-token", "contact-1", { status: "approved" }, { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/me/contact-requests/contact-1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("gets received contact requests", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 0, items: [] })
    }));

    await getContactRequests("session-token", { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/me/contact-requests", {
      headers: {
        Authorization: "Bearer session-token"
      }
    });
  });

  it("creates recommendation runs", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ run: { id: "run-1" } })
    }));

    await createRecommendationRun("session-token", { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/me/recommendation-runs",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("creates physical business card orders", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "payment_pending" })
    }));

    await createPhysicalCardOrder("session-token", { quantity: 200 }, { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/me/physical-card-orders",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("gets physical business card orders", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 0, items: [] })
    }));

    await getPhysicalCardOrders("session-token", { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/me/physical-card-orders", {
      headers: {
        Authorization: "Bearer session-token"
      }
    });
  });

  it("gets sent contact requests", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 0, items: [] })
    }));

    await getSentContactRequests("session-token", { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/me/sent-contact-requests", {
      headers: {
        Authorization: "Bearer session-token"
      }
    });
  });

  it("gets sent project applications", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 0, items: [] })
    }));

    await getSentProjectApplications("session-token", { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/me/project-applications", {
      headers: {
        Authorization: "Bearer session-token"
      }
    });
  });

  it("gets owned project applications and patches owner decisions", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "accepted" })
    }));

    await getOwnedProjectApplications("session-token", { fetchImpl: fetchMock });
    await decideProjectApplication("session-token", "application-1", { status: "accepted" }, { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/me/projects/applications", {
      headers: {
        Authorization: "Bearer session-token"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/me/projects/applications/application-1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("manages owned project posts", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: "project-1" })
    }));

    await getMyProjects("session-token", { fetchImpl: fetchMock });
    await createMyProject("session-token", { title: "모집글" }, { fetchImpl: fetchMock });
    await updateMyProject("session-token", "project-1", { isPublished: false }, { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/me/projects", {
      headers: {
        Authorization: "Bearer session-token"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/me/projects",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/me/projects/project-1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("gets and updates admin physical card orders", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "printed" })
    }));

    await getAdminPhysicalCardOrders("admin-token", { fetchImpl: fetchMock });
    await updateAdminPhysicalCardOrderStatus("admin-token", "order-1", { status: "printed" }, { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/admin/physical-card-orders", {
      headers: {
        Authorization: "Bearer admin-token"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/admin/physical-card-orders/order-1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("gets admin dashboard, members, requests, and logs", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 0, items: [] })
    }));

    await getAdminOverview("admin-token", { fetchImpl: fetchMock });
    await getAdminMembers("admin-token", { fetchImpl: fetchMock });
    await updateAdminMemberPublication(
      "admin-token",
      "member-1",
      { isPublished: false },
      { fetchImpl: fetchMock }
    );
    await getAdminRequests("admin-token", { fetchImpl: fetchMock });
    await getAdminAuditLogs("admin-token", { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/admin/overview", {
      headers: {
        Authorization: "Bearer admin-token"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/admin/members", {
      headers: {
        Authorization: "Bearer admin-token"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/admin/members/member-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ isPublished: false })
      })
    );
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/admin/requests", {
      headers: {
        Authorization: "Bearer admin-token"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/api/admin/audit-logs", {
      headers: {
        Authorization: "Bearer admin-token"
      }
    });
  });
});
