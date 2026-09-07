import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createLocalSupabaseServiceClient } from "../src/db/localSupabase.js";

const projectRows = [
  {
    id: "project-1",
    title: "AI 전자명함 고도화",
    description: "추천 기능을 함께 개선합니다.",
    status: "recruiting",
    deadline: "2026-06-15",
    is_published: true,
    owner_profile_id: "profile-1",
    profiles: { display_name: "김민준", slug: "minjun" },
    project_roles: [{ name: "프론트엔드" }],
    project_skills: [{ name: "Vue" }, { name: "Node.js" }],
    project_interests: [{ name: "AI 서비스" }]
  },
  {
    id: "project-2",
    title: "브랜드 디자인 시스템",
    description: "디자인 시스템을 정리합니다.",
    status: "recruiting",
    deadline: "2026-06-20",
    is_published: true,
    owner_profile_id: "profile-1",
    profiles: { display_name: "김민준", slug: "minjun" },
    project_roles: [{ name: "디자이너" }],
    project_skills: [{ name: "Figma" }],
    project_interests: [{ name: "커뮤니티" }]
  }
];

const createMockSupabase = () => ({
  from(table) {
    assert.equal(table, "projects");
    return {
      select() {
        return {
          eq(column, value) {
            assert.equal(column, "is_published");
            return {
              order: async () => ({
                data: projectRows.filter((row) => row.is_published === value),
                error: null
              })
            };
          }
        };
      }
    };
  }
});

test("GET /api/projects returns published projects", async () => {
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

  const response = await request(app).get("/api/projects").expect(200);

  assert.equal(response.body.count, 2);
  assert.equal(response.body.items[0].title, "AI 전자명함 고도화");
  assert.equal(response.body.items[0].owner.displayName, "김민준");
});

test("GET /api/projects filters published projects by skill and interest", async () => {
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

  const skillResponse = await request(app).get("/api/projects?skill=Figma").expect(200);
  assert.equal(skillResponse.body.count, 1);
  assert.equal(skillResponse.body.items[0].title, "브랜드 디자인 시스템");

  const interestResponse = await request(app).get("/api/projects?interest=AI%20%EC%84%9C%EB%B9%84%EC%8A%A4").expect(200);
  assert.equal(interestResponse.body.count, 1);
  assert.equal(interestResponse.body.items[0].title, "AI 전자명함 고도화");
});

const createAuthenticatedProjectApp = () => {
  const supabase = createLocalSupabaseServiceClient();

  return createApp({
    logger: false,
    env: {
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase,
    supabaseAuth: {
      auth: {
        getUser: async (token) =>
          token === "owner-token"
            ? { data: { user: { id: "demo-owner", email: "owner@example.test", app_metadata: {} } }, error: null }
            : { data: { user: null }, error: { message: "invalid token" } }
      }
    }
  });
};

test("authenticated users can create and list their own project posts", async () => {
  const app = createAuthenticatedProjectApp();

  const created = await request(app)
    .post("/api/me/projects")
    .set("Authorization", "Bearer owner-token")
    .send({
      title: "배포 전 보안 점검",
      description: "서비스 배포 전 보안 점검과 운영 체크리스트를 함께 정리합니다.",
      status: "recruiting",
      deadline: "2026-07-01",
      roles: ["백엔드", "보안"],
      skills: ["Node.js", "Express"],
      interests: ["보안", "운영"],
      isPublished: true
    })
    .expect(201);

  assert.equal(created.body.title, "배포 전 보안 점검");
  assert.deepEqual(created.body.roles, ["백엔드", "보안"]);

  const mine = await request(app)
    .get("/api/me/projects")
    .set("Authorization", "Bearer owner-token")
    .expect(200);

  assert.equal(mine.body.items.some((project) => project.id === created.body.id), true);
});

test("authenticated users without a profile get an empty owned project list", async () => {
  const supabase = createLocalSupabaseServiceClient();
  const app = createApp({
    logger: false,
    env: {
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      supabase: { url: "x", anonKey: "x", serviceRoleKey: "x" }
    },
    supabase,
    supabaseAuth: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "new-user-without-profile", email: "new@example.test", app_metadata: {} } },
          error: null
        })
      }
    }
  });

  const response = await request(app)
    .get("/api/me/projects")
    .set("Authorization", "Bearer owner-token")
    .expect(200);

  assert.deepEqual(response.body, { count: 0, items: [] });
});

test("project owners can update publication and matching fields", async () => {
  const app = createAuthenticatedProjectApp();

  const created = await request(app)
    .post("/api/me/projects")
    .set("Authorization", "Bearer owner-token")
    .send({
      title: "초기 모집글",
      description: "처음 등록한 모집글입니다.",
      status: "recruiting",
      roles: ["기획"],
      skills: ["Vue"],
      interests: ["커뮤니티"]
    })
    .expect(201);

  const updated = await request(app)
    .patch(`/api/me/projects/${created.body.id}`)
    .set("Authorization", "Bearer owner-token")
    .send({
      title: "수정된 모집글",
      status: "closed",
      isPublished: false,
      skills: ["Node.js"]
    })
    .expect(200);

  assert.equal(updated.body.title, "수정된 모집글");
  assert.equal(updated.body.status, "closed");
  assert.equal(updated.body.isPublished, false);
  assert.deepEqual(updated.body.skills, ["Node.js"]);

  const publicProjects = await request(app).get("/api/projects").expect(200);
  assert.equal(publicProjects.body.items.some((project) => project.id === created.body.id), false);
});
