import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

const createMockSupabase = () => ({
  from(table) {
    assert.equal(table, "profiles");
    return {
      select() {
        return {
          eq(column, value) {
            assert.equal(column, "user_id");
            assert.equal(value, "user-1");
            return {
              maybeSingle: async () => ({
                data: {
                  id: "profile-1",
                  user_id: "user-1",
                  slug: "minjun",
                  display_name: "김민준",
                  role: "프론트엔드 개발자",
                  headline: "서비스를 만드는 개발자",
                  bio: "소개",
                  location: "서울",
                  avatar_url: null,
                  email: "minjun@example.test",
                  github_url: null,
                  portfolio_url: null,
                  contact_policy: "approval_required",
                  is_published: false
                },
                error: null
              })
            };
          }
        };
      },
      upsert(payload) {
        assert.equal(payload.user_id, "user-1");
        return {
          select() {
            return {
              single: async () => ({ data: { ...payload, id: "profile-1" }, error: null })
            };
          }
        };
      }
    };
  }
});

const createAuthedApp = () =>
  createApp({
    logger: false,
    env: {
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase: createMockSupabase(),
    supabaseAuth: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-1", email: "minjun@example.test" } },
          error: null
        })
      }
    }
  });

test("GET /api/me returns the authenticated profile", async () => {
  const response = await request(createAuthedApp())
    .get("/api/me")
    .set("Authorization", "Bearer token")
    .expect(200);

  assert.equal(response.body.profile.slug, "minjun");
  assert.equal(response.body.profile.email, "minjun@example.test");
});

test("GET /api/me rejects anonymous users", async () => {
  const app = createApp({
    logger: false,
    env: {
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase: createMockSupabase(),
    supabaseAuth: { auth: { getUser: async () => ({ data: { user: null }, error: null }) } }
  });

  await request(app).get("/api/me").expect(401);
});

test("POST /api/me/profile rejects unsafe external profile URLs", async () => {
  const response = await request(createAuthedApp())
    .post("/api/me/profile")
    .set("Authorization", "Bearer token")
    .send({
      slug: "minjun",
      displayName: "김민준",
      websiteUrl: "javascript:alert(1)"
    })
    .expect(400);

  assert.equal(response.body.message, "프로필 링크는 http 또는 https 주소만 사용할 수 있습니다.");
  assert.deepEqual(response.body.details, [
    {
      field: "websiteUrl",
      message: "http 또는 https 주소를 입력해주세요."
    }
  ]);
});
