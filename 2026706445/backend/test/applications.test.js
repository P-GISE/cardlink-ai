import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createLocalSupabaseServiceClient } from "../src/db/localSupabase.js";

const createMockSupabase = () => ({
  from(table) {
    if (table === "profiles") {
      return {
        select() {
          return {
            eq(column, value) {
              assert.equal(column, "user_id");
              assert.equal(value, "user-1");
              return {
                maybeSingle: async () => ({
                  data: { id: "profile-1", user_id: "user-1", display_name: "김민준" },
                  error: null
                })
              };
            }
          };
        }
      };
    }

    if (table === "project_applications") {
      return {
        insert(payload) {
          assert.equal(payload.project_id, "project-1");
          assert.equal(payload.applicant_profile_id, "profile-1");
          assert.equal(payload.message, "참여하고 싶습니다.");
          assert.equal(payload.status, "pending");
          return {
            select() {
              return {
                single: async () => ({
                  data: { id: "application-1", ...payload },
                  error: null
                })
              };
            }
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

test("POST /api/projects/:id/applications creates a pending application", async () => {
  const response = await request(createAuthedApp())
    .post("/api/projects/project-1/applications")
    .set("Authorization", "Bearer token")
    .send({ message: "참여하고 싶습니다." })
    .expect(201);

  assert.equal(response.body.id, "application-1");
  assert.equal(response.body.status, "pending");
  assert.equal(response.body.projectId, "project-1");
});

test("POST /api/projects/:id/applications rejects anonymous requests", async () => {
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

  await request(app).post("/api/projects/project-1/applications").send({}).expect(401);
});

const createLocalApplicationsApp = async ({
  withSentApplication = false,
  withOwnedApplication = false,
  withForeignApplication = false
} = {}) => {
  const supabase = createLocalSupabaseServiceClient();

  await supabase.from("profiles").insert({
    id: "local-caller-profile",
    user_id: "local-user",
    slug: "local-caller",
    display_name: "Local Caller",
    role: "Product Builder",
    headline: "Builds products",
    email: "local@example.test",
    contact_policy: "approval_required",
    is_published: true
  });

  if (withSentApplication) {
    await supabase.from("project_applications").insert({
      id: "sent-application-1",
      project_id: "project-001",
      applicant_profile_id: "local-caller-profile",
      message: "I want to join this project.",
      status: "pending",
      created_at: "2026-05-30T00:00:00.000Z"
    });
  }

  if (withOwnedApplication) {
    await supabase.from("profiles").insert({
      id: "project-applicant-profile",
      user_id: "project-applicant-user",
      slug: "project-applicant",
      display_name: "Project Applicant",
      role: "Frontend Developer",
      headline: "Vue and UX",
      email: "applicant@example.test",
      contact_policy: "approval_required",
      is_published: true
    });

    await supabase.from("projects").insert({
      id: "owned-project-1",
      owner_profile_id: "local-caller-profile",
      title: "Owned Project",
      description: "A project owned by the caller.",
      status: "recruiting",
      deadline: "2026-06-30",
      is_published: true
    });

    await supabase.from("project_applications").insert({
      id: "owner-application-1",
      project_id: "owned-project-1",
      applicant_profile_id: "project-applicant-profile",
      message: "I can help with the frontend.",
      status: "pending",
      created_at: "2026-05-30T00:00:00.000Z"
    });
  }

  if (withForeignApplication) {
    await supabase.from("profiles").insert({
      id: "foreign-owner-profile",
      user_id: "foreign-owner-user",
      slug: "foreign-owner",
      display_name: "Foreign Owner",
      role: "Owner",
      headline: "Owns another project",
      email: "foreign-owner@example.test",
      contact_policy: "approval_required",
      is_published: true
    });

    await supabase.from("profiles").insert({
      id: "foreign-applicant-profile",
      user_id: "foreign-applicant-user",
      slug: "foreign-applicant",
      display_name: "Foreign Applicant",
      role: "Backend Developer",
      headline: "APIs",
      email: "foreign-applicant@example.test",
      contact_policy: "approval_required",
      is_published: true
    });

    await supabase.from("projects").insert({
      id: "foreign-project-1",
      owner_profile_id: "foreign-owner-profile",
      title: "Foreign Project",
      description: "A project not owned by the caller.",
      status: "recruiting",
      deadline: "2026-06-30",
      is_published: true
    });

    await supabase.from("project_applications").insert({
      id: "foreign-application-1",
      project_id: "foreign-project-1",
      applicant_profile_id: "foreign-applicant-profile",
      message: "I can help.",
      status: "pending",
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

test("GET /api/me/project-applications lists applications sent by the current user", async () => {
  const app = await createLocalApplicationsApp({ withSentApplication: true });

  const response = await request(app)
    .get("/api/me/project-applications")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);

  assert.equal(response.body.count, 1);
  assert.equal(response.body.items[0].id, "sent-application-1");
  assert.equal(response.body.items[0].status, "pending");
  assert.equal(response.body.items[0].project.id, "project-001");
});

test("project owners can list and accept applications for their projects", async () => {
  const app = await createLocalApplicationsApp({ withOwnedApplication: true });

  const listResponse = await request(app)
    .get("/api/me/projects/applications")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);

  assert.equal(listResponse.body.count, 1);
  assert.equal(listResponse.body.items[0].id, "owner-application-1");
  assert.equal(listResponse.body.items[0].project.title, "Owned Project");
  assert.equal(listResponse.body.items[0].applicant.displayName, "Project Applicant");

  const decisionResponse = await request(app)
    .patch("/api/me/projects/applications/owner-application-1")
    .set("Authorization", "Bearer local-dev-token")
    .send({ status: "accepted" })
    .expect(200);

  assert.equal(decisionResponse.body.status, "accepted");
});

test("project application decisions are scoped to projects owned by the current user", async () => {
  const app = await createLocalApplicationsApp({ withForeignApplication: true });

  await request(app)
    .patch("/api/me/projects/applications/foreign-application-1")
    .set("Authorization", "Bearer local-dev-token")
    .send({ status: "accepted" })
    .expect(404);
});
