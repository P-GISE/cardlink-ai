import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

const createMockSupabase = () => ({
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
                    data: {
                      id: "profile-1",
                      user_id: "user-1",
                      display_name: "Minjun",
                      role: "Frontend Developer",
                      location: "Seoul"
                    },
                    error: null
                  })
                };
              }

              if (column === "is_published") {
                assert.equal(value, true);
                return {
                  neq(excludedColumn, excludedValue) {
                    assert.equal(excludedColumn, "id");
                    assert.equal(excludedValue, "profile-1");
                    return {
                      order(orderColumn, options) {
                        assert.equal(orderColumn, "updated_at");
                        assert.deepEqual(options, { ascending: false });
                        return {
                          limit(limitValue) {
                            assert.equal(limitValue, 5);
                            return Promise.resolve({
                              data: [
                                {
                                  id: "profile-2",
                                  slug: "soyeon",
                                  display_name: "Soyeon",
                                  role: "Frontend Developer",
                                  headline: "Vue UI engineer",
                                  location: "Seoul",
                                  is_published: true
                                },
                                {
                                  id: "profile-3",
                                  slug: "jisu",
                                  display_name: "Jisu",
                                  role: "Backend Developer",
                                  headline: "API engineer",
                                  location: "Busan",
                                  is_published: true
                                }
                              ],
                              error: null
                            });
                          }
                        };
                      }
                    };
                  }
                };
              }

              throw new Error(`unexpected profile column ${column}`);
            }
          };
        }
      };
    }

    if (table === "recommendation_runs") {
      return {
        insert(payload) {
          assert.deepEqual(payload, { profile_id: "profile-1", source: "db_rules" });
          return {
            select() {
              return {
                single: async () => ({
                  data: { id: "run-1", ...payload, created_at: "2026-05-21T00:00:00.000Z" },
                  error: null
                })
              };
            }
          };
        }
      };
    }

    if (table === "recommendations") {
      return {
        insert(payload) {
          assert.equal(payload.length, 2);
          assert.equal(payload[0].run_id, "run-1");
          assert.equal(payload[0].target_profile_id, "profile-1");
          assert.equal(payload[0].recommended_profile_id, "profile-2");
          assert.equal(payload[0].score > payload[1].score, true);
          return {
            select: async () => ({
              data: payload.map((row, index) => ({
                id: `recommendation-${index + 1}`,
                created_at: "2026-05-21T00:00:00.000Z",
                ...row
              })),
              error: null
            })
          };
        }
      };
    }

    throw new Error(`unexpected table ${table}`);
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

test("POST /api/me/recommendation-runs creates a DB-based recommendation run", async () => {
  const response = await request(createAuthedApp())
    .post("/api/me/recommendation-runs")
    .set("Authorization", "Bearer token")
    .send({})
    .expect(201);

  assert.equal(response.body.run.id, "run-1");
  assert.equal(response.body.run.source, "db_rules");
  assert.equal(response.body.recommendations.length, 2);
  assert.equal(response.body.recommendations[0].recommendedProfileId, "profile-2");
  assert.equal(response.body.recommendations[0].score, 90);
});

test("POST /api/me/recommendation-runs rejects anonymous requests", async () => {
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

  await request(app).post("/api/me/recommendation-runs").send({}).expect(401);
});
