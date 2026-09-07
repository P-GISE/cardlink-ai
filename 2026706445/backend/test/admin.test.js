import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createLocalSupabaseServiceClient } from "../src/db/localSupabase.js";

const createAdminApp = async () => {
  const supabase = createLocalSupabaseServiceClient();

  await supabase.from("contact_requests").insert({
    id: "admin-contact-1",
    target_profile_id: "profile-demo",
    requester_profile_id: "profile-recommendation-1",
    status: "pending",
    request_type: "approval_request",
    message: "협업 이야기를 나누고 싶습니다.",
    created_at: "2026-05-30T00:00:00.000Z"
  });

  await supabase.from("project_applications").insert({
    id: "admin-application-1",
    project_id: "project-001",
    applicant_profile_id: "profile-recommendation-2",
    message: "프로젝트에 참여하고 싶습니다.",
    status: "pending",
    created_at: "2026-05-30T01:00:00.000Z"
  });

  await supabase.from("physical_card_orders").insert({
    id: "admin-order-1",
    user_id: "demo-owner",
    profile_id: "profile-demo",
    card_size: "kr_standard",
    template: "classic",
    accent_color: "#2357d3",
    paper_type: "snow_250",
    finish: "matte",
    quantity: 200,
    qr_placement: "back",
    recipient_name: "Customer",
    recipient_phone: "010-1111-2222",
    shipping_address: "Seoul",
    shipping_address_detail: "101",
    memo: "Please print clearly.",
    status: "production_pending",
    created_at: "2026-05-30T02:00:00.000Z"
  });

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
        getUser: async (token) => {
          if (token === "local-admin-token") {
            return {
              data: {
                user: {
                  id: "admin-user",
                  email: "admin@example.test",
                  app_metadata: { role: "admin" }
                }
              },
              error: null
            };
          }

          if (token === "local-dev-token") {
            return {
              data: { user: { id: "local-user", email: "local@example.test", app_metadata: {} } },
              error: null
            };
          }

          return { data: { user: null }, error: { message: "invalid token" } };
        }
      }
    }
  });
};

test("admin overview summarizes members, requests, orders, and activity", async () => {
  const app = await createAdminApp();

  const response = await request(app)
    .get("/api/admin/overview")
    .set("Authorization", "Bearer local-admin-token")
    .expect(200);

  assert.equal(response.body.cards.find((card) => card.key === "members").value >= 3, true);
  assert.equal(response.body.cards.find((card) => card.key === "pendingContacts").value, 1);
  assert.equal(response.body.cards.find((card) => card.key === "pendingApplications").value, 1);
  assert.equal(response.body.cards.find((card) => card.key === "activeOrders").value, 1);
  assert.equal(response.body.recentActivity.length >= 3, true);
});

test("admins can inspect members, requests, and operation logs", async () => {
  const app = await createAdminApp();

  const members = await request(app)
    .get("/api/admin/members")
    .set("Authorization", "Bearer local-admin-token")
    .expect(200);

  assert.equal(members.body.items.some((item) => item.slug === "minjun"), true);
  assert.equal(members.body.items[0].hasProfile, true);

  const requests = await request(app)
    .get("/api/admin/requests")
    .set("Authorization", "Bearer local-admin-token")
    .expect(200);

  assert.equal(requests.body.count, 2);
  assert.equal(requests.body.items.some((item) => item.kind === "컨택"), true);
  assert.equal(requests.body.items.some((item) => item.kind === "참가"), true);

  const logs = await request(app)
    .get("/api/admin/audit-logs")
    .set("Authorization", "Bearer local-admin-token")
    .expect(200);

  assert.equal(logs.body.items.some((item) => item.action === "실물 명함 주문 접수"), true);
  assert.equal(logs.body.items.some((item) => item.action === "컨택 요청 접수"), true);
});

test("admins can hide or publish member profiles and create audit logs", async () => {
  const app = await createAdminApp();

  const update = await request(app)
    .patch("/api/admin/members/profile-recommendation-1")
    .set("Authorization", "Bearer local-admin-token")
    .send({ isPublished: false })
    .expect(200);

  assert.equal(update.body.id, "profile-recommendation-1");
  assert.equal(update.body.isPublished, false);
  assert.equal(update.body.status, "hidden");

  const logs = await request(app)
    .get("/api/admin/audit-logs")
    .set("Authorization", "Bearer local-admin-token")
    .expect(200);

  assert.equal(
    logs.body.items.some(
      (item) =>
        item.actionKey === "member_publication_updated" &&
        item.actor === "admin@example.test" &&
        item.target === update.body.displayName &&
        item.status === "hidden"
    ),
    true
  );
});

test("admin physical card status changes create audit logs", async () => {
  const app = await createAdminApp();

  await request(app)
    .patch("/api/admin/physical-card-orders/admin-order-1")
    .set("Authorization", "Bearer local-admin-token")
    .send({ status: "printed" })
    .expect(200);

  const logs = await request(app)
    .get("/api/admin/audit-logs")
    .set("Authorization", "Bearer local-admin-token")
    .expect(200);

  assert.equal(
    logs.body.items.some(
      (item) =>
        item.actionKey === "physical_card_order_status_updated" &&
        item.actor === "admin@example.test" &&
        item.target === "Customer" &&
        item.status === "printed"
    ),
    true
  );
});

test("admin APIs reject non-admin users", async () => {
  const app = await createAdminApp();

  await request(app)
    .get("/api/admin/overview")
    .set("Authorization", "Bearer local-dev-token")
    .expect(403);
});
