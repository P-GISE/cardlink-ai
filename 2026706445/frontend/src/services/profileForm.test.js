import { describe, expect, it } from "vitest";
import {
  buildProfileReadiness,
  emptyProjectExperience,
  formatListInput,
  normalizeExternalUrl,
  normalizeProjects,
  parseListInput
} from "./profileForm.js";

describe("profile form helpers", () => {
  it("parses skills from comma or line separated input", () => {
    expect(parseListInput("Vue, Node.js\nSupabase,  ")).toEqual(["Vue", "Node.js", "Supabase"]);
  });

  it("formats saved skills for editing", () => {
    expect(formatListInput(["Vue", "Node.js"])).toBe("Vue, Node.js");
  });

  it("normalizes project experience rows and drops unnamed rows", () => {
    expect(
      normalizeProjects([
        { name: " 포트폴리오 ", period: "2026", description: " 제작 ", projectUrl: " https://example.test " },
        { name: "", period: "2025", description: "무시" }
      ])
    ).toEqual([
      {
        name: "포트폴리오",
        period: "2026",
        description: "제작",
        projectUrl: "https://example.test"
      }
    ]);
  });

  it("keeps only http and https profile links", () => {
    expect(normalizeExternalUrl(" https://example.test/profile ")).toBe("https://example.test/profile");
    expect(normalizeExternalUrl("http://localhost:5173/demo")).toBe("http://localhost:5173/demo");
    expect(normalizeExternalUrl("javascript:alert(1)")).toBe("");
    expect(normalizeExternalUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("summarizes profile readiness and unsafe links", () => {
    const readiness = buildProfileReadiness({
      slug: "minjun",
      displayName: "김민준",
      headline: "제품을 만드는 개발자",
      bio: "협업과 실험을 좋아합니다.",
      skillsText: "Vue, Node.js",
      projects: [{ name: "CardLink", period: "2026", description: "전자명함", projectUrl: "" }],
      websiteUrl: "javascript:alert(1)",
      isPublished: true
    });

    expect(readiness.score).toBe(80);
    expect(readiness.items).toContainEqual({
      key: "safeLinks",
      label: "안전한 링크",
      complete: false,
      detail: "대표 웹사이트 링크를 확인해주세요."
    });
  });

  it("creates a blank project experience row", () => {
    expect(emptyProjectExperience()).toEqual({
      name: "",
      period: "",
      description: "",
      projectUrl: ""
    });
  });
});
