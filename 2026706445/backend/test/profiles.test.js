import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

const profileRows = [
  {
    id: "profile-1",
    slug: "minjun",
    display_name: "김민준",
    role: "프론트엔드 개발자",
    headline: "사용자 경험을 개선하는 개발자",
    bio: "Vue와 협업 경험을 갖춘 개발자입니다.",
    location: "서울",
    avatar_url: null,
    contact_policy: "approval_required",
    is_published: true,
    phone: "010-9999-9999",
    business_address: "Synthetic public business address",
    website_url: "https://hidden.example.test",
    email: "hidden@example.test",
    github_url: "https://github.com/hidden",
    portfolio_url: "https://portfolio.example.test"
  }
];

const createMockSupabase = () => ({
  from(table) {
    assert.equal(table, "profiles");
    return {
      select(columns) {
        for (const column of ["phone", "email", "website_url", "github_url", "portfolio_url", "user_id"]) {
          assert.ok(!columns.split(", ").includes(column), `Public queries must not fetch ${column}`);
        }
        return {
          eq(column, value) {
            if (column === "is_published") {
              return {
                order: async () => ({
                  data: profileRows.filter((row) => row.is_published === value),
                  error: null
                })
              };
            }
            if (column === "slug") {
              return {
                eq() {
                  return {
                    single: async () => ({ data: profileRows[0], error: null })
                  };
                }
              };
            }
            throw new Error(`unexpected column ${column}`);
          }
        };
      }
    };
  }
});

test("GET /api/profiles returns published profiles without contact fields", async () => {
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

  const response = await request(app).get("/api/profiles").expect(200);

  assert.equal(response.body.count, 1);
  assert.equal(response.body.items[0].displayName, "김민준");
  assert.equal(response.body.items[0].email, undefined);
  assert.equal(response.body.items[0].phone, undefined);
  assert.equal(response.body.items[0].websiteUrl, undefined);
  assert.equal(response.body.items[0].githubUrl, undefined);
  assert.equal(response.body.items[0].portfolioUrl, undefined);
  assert.equal(response.body.items[0].userId, undefined);
  assert.equal(response.body.items[0].businessAddress, "Synthetic public business address");
});

test("GET /api/profiles/:slug does not expose contact fields before approval", async () => {
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

  const response = await request(app).get("/api/profiles/minjun").expect(200);

  assert.equal(response.body.email, undefined);
  assert.equal(response.body.phone, undefined);
  assert.equal(response.body.websiteUrl, undefined);
  assert.equal(response.body.githubUrl, undefined);
  assert.equal(response.body.portfolioUrl, undefined);
  assert.equal(response.body.contact, undefined);
  assert.equal(response.body.userId, undefined);
  assert.equal(response.body.businessAddress, "Synthetic public business address");
});
