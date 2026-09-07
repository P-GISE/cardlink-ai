import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";

const createLocalApp = () =>
  createApp({
    logger: false,
    env: loadEnv({
      NODE_ENV: "development",
      CORS_ORIGIN: "http://localhost:5173",
      ENABLE_LOCAL_AUTH: "true"
    })
  });

test("local development app starts without Supabase credentials", async () => {
  const response = await request(createLocalApp()).get("/api/health").expect(200);

  assert.equal(response.body.status, "ok");
});

test("local development app serves demo profiles and projects", async () => {
  const app = createLocalApp();

  const profilesResponse = await request(app).get("/api/profiles/minjun").expect(200);
  const projectsResponse = await request(app).get("/api/projects").expect(200);

  assert.equal(profilesResponse.body.slug, "minjun");
  assert.equal(profilesResponse.body.displayName.length > 0, true);
  assert.equal(projectsResponse.body.count > 0, true);
});

test("local development app serves public recommendation demos", async () => {
  const response = await request(createLocalApp()).get("/api/recommendations/public").expect(200);

  assert.equal(response.body.count > 0, true);
});

test("local recommendation demos can be used for authenticated contact requests", async () => {
  const app = createLocalApp();

  const recommendationsResponse = await request(app).get("/api/recommendations/public").expect(200);
  const target = recommendationsResponse.body.items[0];

  assert.equal(typeof target.slug, "string");

  await request(app)
    .post("/api/me/profile")
    .set("Authorization", "Bearer local-dev-token")
    .send({
      slug: "my-contact-card",
      displayName: "컨택 요청자",
      role: "프론트엔드 개발자",
      headline: "협업 가능한 개발자",
      bio: "추천 프로필에 컨택 요청을 보냅니다.",
      email: "requester@example.test",
      contactPolicy: "approval_required",
      isPublished: true
    })
    .expect(201);

  const contactResponse = await request(app)
    .post(`/api/profiles/${target.slug}/contact-requests`)
    .set("Authorization", "Bearer local-dev-token")
    .send({ message: "협업 관련해서 연락하고 싶습니다." })
    .expect(201);

  assert.ok(["approved", "pending"].includes(contactResponse.body.status));
});

test("local development auth can create a profile instead of using the demo profile as mine", async () => {
  const app = createLocalApp();

  const emptyProfileResponse = await request(app)
    .get("/api/me")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);
  assert.equal(emptyProfileResponse.body.profile, null);

  const createdResponse = await request(app)
    .post("/api/me/profile")
    .set("Authorization", "Bearer local-dev-token")
    .send({
      slug: "my-card",
      displayName: "내 전자명함",
      role: "개발자",
      headline: "직접 만든 전자명함",
      bio: "회원가입 후 생성한 전자명함입니다.",
      email: "me@example.test",
      skills: ["Vue", "Node.js", "Supabase"],
      projects: [
        {
          name: "전자명함 플랫폼",
          period: "2026",
          description: "로그인 기반 전자명함 생성 기능 구현",
          projectUrl: "https://example.test/card"
        }
      ],
      contactPolicy: "approval_required",
      isPublished: true
    })
    .expect(201);

  assert.equal(createdResponse.body.slug, "my-card");
  assert.equal(createdResponse.body.displayName, "내 전자명함");
  assert.deepEqual(createdResponse.body.skills, ["Vue", "Node.js", "Supabase"]);
  assert.equal(createdResponse.body.projects[0].name, "전자명함 플랫폼");

  const savedResponse = await request(app)
    .get("/api/me")
    .set("Authorization", "Bearer local-dev-token")
    .expect(200);

  assert.deepEqual(savedResponse.body.profile.skills, ["Vue", "Node.js", "Supabase"]);
  assert.equal(savedResponse.body.profile.projects[0].description, "로그인 기반 전자명함 생성 기능 구현");
});
