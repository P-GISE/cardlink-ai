import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createLocalSupabaseServiceClient } from "../src/db/localSupabase.js";

const createMockSupabase = (targetPolicy = "instant", published = true) => ({
  from(table) {
    if (table === "profiles") {
      return {
        select() {
          return {
            eq(column, value) {
              if (column === "user_id") {
                assert.equal(value, "user-1");
                return {
                  maybeSingle: async () => ({
                    data: { id: "requester-1", user_id: "user-1", display_name: "요청자" },
                    error: null
                  })
                };
              }

              if (column === "slug") {
                assert.equal(value, "target");
                return {
                  maybeSingle: async () => ({
                    data: {
                      id: "target-1",
                      slug: "target",
                      display_name: "대상자",
                      email: "target@example.test",
                      github_url: "https://github.com/target",
                      portfolio_url: "https://target.example.test",
                      contact_policy: targetPolicy,
                      is_published: published
                    },
                    error: null
                  })
                };
              }

              throw new Error(`unexpected profile column ${column}`);
            }
          };
        }
      };
    }

    if (table === "contact_requests") {
      return {
        insert(payload) {
          return {
            select() {
              return {
                single: async () => ({
                  data: { id: "contact-1", ...payload },
                  error: null
                })
              };
            }
          };
        },
        update(payload) {
          assert.equal(payload.status, "approved");
          return {
            eq(column, value) {
              assert.equal(column, "id");
              assert.equal(value, "contact-1");
              return {
                eq(ownerColumn, ownerValue) {
                  assert.equal(ownerColumn, "target_profile_id");
                  assert.equal(ownerValue, "requester-1");
                  return {
                    select() {
                      return {
                        single: async () => ({
                          data: {
                            id: "contact-1",
                            target_profile_id: "requester-1",
                            requester_profile_id: "other-1",
                            status: "approved",
                            request_type: "approval_request",
                            message: "안녕하세요"
                          },
                          error: null
                        })
                      };
                    }
                  };
                }
              };
            }
          };
        }
      };
    }

    throw new Error(`unexpected table ${table}`);
  }
});

const createAuthedApp = (targetPolicy, published = true) =>
  createApp({
    logger: false,
    env: {
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase: createMockSupabase(targetPolicy, published),
    supabaseAuth: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-1", email: "requester@example.test" } },
          error: null
        })
      }
    }
  });

test("instant contact policy reveals contact fields for authenticated users", async () => {
  const response = await request(createAuthedApp("instant"))
    .post("/api/profiles/target/contact-requests")
    .set("Authorization", "Bearer token")
    .send({ message: "연락하고 싶습니다." })
    .expect(201);

  assert.equal(response.body.status, "approved");
  assert.equal(response.body.contact.email, "target@example.test");
  assert.equal(response.body.request.requestType, "instant_reveal");
});

test("approval-required contact policy creates a pending request", async () => {
  const response = await request(createAuthedApp("approval_required"))
    .post("/api/profiles/target/contact-requests")
    .set("Authorization", "Bearer token")
    .send({ message: "연락하고 싶습니다." })
    .expect(201);

  assert.equal(response.body.status, "pending");
  assert.equal(response.body.contact, undefined);
  assert.equal(response.body.request.requestType, "approval_request");
});

for (const policy of ["instant", "approval_required"]) {
  test(`unpublished ${policy} profiles reject new contact requests without exposing contact`, async () => {
    const response = await request(createAuthedApp(policy, false))
      .post("/api/profiles/target/contact-requests")
      .set("Authorization", "Bearer token")
      .send({ message: "synthetic privacy regression" })
      .expect(404);
    assert.equal(response.body.contact, undefined);
    assert.equal(response.body.request, undefined);
  });
}

test("profile owner can approve a contact request", async () => {
  const response = await request(createAuthedApp("approval_required"))
    .patch("/api/me/contact-requests/contact-1")
    .set("Authorization", "Bearer token")
    .send({ status: "approved" })
    .expect(200);

  assert.equal(response.body.status, "approved");
  assert.equal(response.body.id, "contact-1");
});

const createLocalContactListApp = async ({ withRequest = false, withSentRequest = false } = {}) => {
  const supabase = createLocalSupabaseServiceClient();

  await supabase.from("profiles").insert({
    id: "local-owner-profile",
    user_id: "local-user",
    slug: "local-owner",
    display_name: "내 전자명함",
    role: "프로덕트 개발자",
    headline: "컨택 요청을 받는 사용자",
    bio: "컨택 요청 목록 테스트용 프로필입니다.",
    email: "owner@example.test",
    contact_policy: "approval_required",
    is_published: true
  });

  if (withRequest) {
    await supabase.from("contact_requests").insert({
      id: "received-contact-1",
      target_profile_id: "local-owner-profile",
      requester_profile_id: "profile-recommendation-1",
      status: "pending",
      request_type: "approval_request",
      message: "협업 관련해서 연락하고 싶습니다.",
      decided_at: null,
      created_at: "2026-05-30T00:00:00.000Z"
    });
  }

  if (withSentRequest) {
    await supabase.from("contact_requests").insert({
      id: "sent-contact-1",
      target_profile_id: "profile-recommendation-1",
      requester_profile_id: "local-owner-profile",
      status: "approved",
      request_type: "approval_request",
      message: "프로필을 보고 협업 이야기를 나누고 싶습니다.",
      decided_at: "2026-05-30T01:00:00.000Z",
      created_at: "2026-05-30T00:00:00.000Z"
    });
  }

  return createApp({
    logger: false,
    env: {
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      supabase: { url: "", anonKey: "", serviceRoleKey: "", isConfigured: false }
    },
    supabase,
    supabaseAuth: {
      auth: {
        getUser: async (token) =>
          token === "local-dev-token"
            ? {
                data: { user: { id: "local-user", email: "local@example.test" } },
                error: null
              }
            : {
                data: { user: null },
                error: { message: "invalid token" }
              }
      }
    }
  });
};

test("GET /api/me/contact-requests rejects anonymous requests", async () => {
  const app = await createLocalContactListApp();

  await request(app).get("/api/me/contact-requests").expect(401);
});

test("GET /api/me/contact-requests returns an empty list when no requests exist", async () => {
  const app = await createLocalContactListApp();

  const response = await request(app)
    .get("/api/me/contact-requests")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);

  assert.equal(response.body.count, 0);
  assert.deepEqual(response.body.items, []);
});

test("GET /api/me/contact-requests lists received contact requests and reflects decisions", async () => {
  const app = await createLocalContactListApp({ withRequest: true });

  const listResponse = await request(app)
    .get("/api/me/contact-requests")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);

  assert.equal(listResponse.body.count, 1);
  assert.equal(listResponse.body.items[0].id, "received-contact-1");
  assert.equal(listResponse.body.items[0].status, "pending");
  assert.equal(listResponse.body.items[0].requestType, "approval_request");
  assert.equal(listResponse.body.items[0].message, "협업 관련해서 연락하고 싶습니다.");
  assert.equal(listResponse.body.items[0].requester.displayName.length > 0, true);
  assert.equal(listResponse.body.items[0].requester.slug, "seoyeon-lee");

  await request(app)
    .patch("/api/me/contact-requests/received-contact-1")
    .set("Authorization", "Bearer local-dev-token")
    .send({ status: "approved" })
    .expect(200);

  const approvedListResponse = await request(app)
    .get("/api/me/contact-requests")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);

  assert.equal(approvedListResponse.body.items[0].status, "approved");
  assert.equal(typeof approvedListResponse.body.items[0].decidedAt, "string");
});

test("GET /api/me/sent-contact-requests lists sent requests and reveals approved contact details", async () => {
  const app = await createLocalContactListApp({ withSentRequest: true });

  const response = await request(app)
    .get("/api/me/sent-contact-requests")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);

  assert.equal(response.body.count, 1);
  assert.equal(response.body.items[0].id, "sent-contact-1");
  assert.equal(response.body.items[0].status, "approved");
  assert.equal(response.body.items[0].target.slug, "seoyeon-lee");
  assert.equal(response.body.items[0].target.contact.email, "seoyeon.lee@example.com");
});
