import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { createLocalSupabaseServiceClient } from "../src/db/localSupabase.js";

const createLocalApp = () =>
  createApp({
    logger: false,
    env: loadEnv({
      NODE_ENV: "development",
      CORS_ORIGIN: "http://localhost:5173",
      ENABLE_LOCAL_AUTH: "true"
    })
  });

const createProfile = (app) =>
  request(app)
    .post("/api/me/profile")
    .set("Authorization", "Bearer local-dev-token")
    .send({
      slug: "print-card",
      displayName: "Print Card User",
      organization: "CardLink Studio",
      position: "Founder",
      phone: "010-1234-5678",
      websiteUrl: "https://cardlink.example.test",
      businessAddress: "Seoul",
      cardTagline: "QR business card",
      contactPolicy: "approval_required",
      isPublished: true
    });

test("POST /api/me/physical-card-orders rejects anonymous users", async () => {
  await request(createLocalApp()).post("/api/me/physical-card-orders").send({}).expect(401);
});

test("authenticated users can create and list payment-pending physical card orders", async () => {
  const app = createLocalApp();
  const profileResponse = await createProfile(app).expect(201);

  const createdResponse = await request(app)
    .post("/api/me/physical-card-orders")
    .set("Authorization", "Bearer local-dev-token")
    .send({
      profileId: profileResponse.body.id,
      cardSize: "kr_standard",
      template: "classic",
      accentColor: "#2357d3",
      paperType: "snow_250",
      finish: "matte",
      quantity: 200,
      qrPlacement: "back",
      recipientName: "Print Card User",
      recipientPhone: "010-1234-5678",
      shippingAddress: "Seoul",
      shippingAddressDetail: "101",
      memo: "Please print the QR clearly."
    })
    .expect(201);

  assert.equal(createdResponse.body.status, "payment_pending");
  assert.equal(createdResponse.body.quantity, 200);
  assert.equal(createdResponse.body.cardSize, "kr_standard");
  assert.equal(createdResponse.body.paperType, "snow_250");
  assert.equal(createdResponse.body.profileId, profileResponse.body.id);

  const listResponse = await request(app)
    .get("/api/me/physical-card-orders")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);

  assert.equal(listResponse.body.count, 1);
  assert.equal(listResponse.body.items[0].status, "payment_pending");
  assert.equal(listResponse.body.items[0].recipientName, "Print Card User");
});

const createAdminOrderApp = async () => {
  const supabase = createLocalSupabaseServiceClient();

  await supabase.from("physical_card_orders").insert({
    id: "physical-order-1",
    user_id: "customer-user",
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
    status: "payment_pending",
    created_at: "2026-05-30T00:00:00.000Z"
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

test("admins can list all physical card orders and update production status", async () => {
  const app = await createAdminOrderApp();

  const listResponse = await request(app)
    .get("/api/admin/physical-card-orders")
    .set("Authorization", "Bearer local-admin-token")
    .expect(200);

  assert.equal(listResponse.body.count, 1);
  assert.equal(listResponse.body.items[0].id, "physical-order-1");
  assert.equal(listResponse.body.items[0].status, "payment_pending");

  const updateResponse = await request(app)
    .patch("/api/admin/physical-card-orders/physical-order-1")
    .set("Authorization", "Bearer local-admin-token")
    .send({ status: "printed" })
    .expect(200);

  assert.equal(updateResponse.body.status, "printed");
});

test("POST /api/me/physical-card-orders rejects unsupported physical card specs", async () => {
  const app = createLocalApp();
  const profileResponse = await createProfile(app).expect(201);

  const response = await request(app)
    .post("/api/me/physical-card-orders")
    .set("Authorization", "Bearer local-dev-token")
    .send({
      profileId: profileResponse.body.id,
      cardSize: "oversize",
      template: "classic",
      accentColor: "#2357d3",
      paperType: "snow_250",
      finish: "matte",
      quantity: 100,
      qrPlacement: "back",
      recipientName: "Print Card User",
      recipientPhone: "010-1234-5678",
      shippingAddress: "Seoul"
    })
    .expect(400);

  assert.equal(response.body.message, "지원하지 않는 명함 규격입니다.");
});

test("admin physical card APIs reject non-admin users and invalid statuses", async () => {
  const app = await createAdminOrderApp();

  await request(app)
    .get("/api/admin/physical-card-orders")
    .set("Authorization", "Bearer local-dev-token")
    .expect(403);

  await request(app)
    .patch("/api/admin/physical-card-orders/physical-order-1")
    .set("Authorization", "Bearer local-admin-token")
    .send({ status: "done" })
    .expect(400);
});
