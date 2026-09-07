import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const readView = (fileName) => readFileSync(resolve(currentDir, fileName), "utf8");
const readComponent = (fileName) => readFileSync(resolve(currentDir, "../components", fileName), "utf8");
const readStyles = () => readFileSync(resolve(currentDir, "../assets/styles.css"), "utf8");

describe("UX polish", () => {
  it("turns the home page into a task-oriented entry point", () => {
    const source = readView("HomeView.vue");

    expect(source).toContain("빠른 시작");
    expect(source).toContain("전자명함 만들기");
    expect(source).toContain("프로젝트 찾기");
    expect(source).toContain("내 요청 확인");
    expect(source).toContain("home-quick-start");
  });

  it("keeps request status follow-up one click away after contact or project actions", () => {
    expect(readComponent("ProjectCard.vue")).toContain("내 요청 상태 보기");
    expect(readComponent("ProjectCard.vue")).toContain('to="/requests/sent"');
    expect(readComponent("RecommendationCard.vue")).toContain("내 요청 상태 보기");
    expect(readComponent("RecommendationCard.vue")).toContain('to="/requests/sent"');
  });

  it("adds clearer filter reset and request status summaries", () => {
    expect(readView("CommunityView.vue")).toContain("clearFilters");
    expect(readView("CommunityView.vue")).toContain("필터 초기화");
    expect(readView("SentRequestsView.vue")).toContain("requestSummary");
    expect(readView("SentRequestsView.vue")).toContain("summary-cards");
    expect(readView("ContactRequestsView.vue")).toContain("requestSummary");
    expect(readView("ContactRequestsView.vue")).toContain("summary-cards");
  });

  it("uses stronger loading and responsive layout affordances", () => {
    expect(readComponent("LoadingState.vue")).toContain("loading-card");
    expect(readComponent("LoadingState.vue")).toContain("loading-spinner");
    expect(readStyles()).toContain(".home-quick-start");
    expect(readStyles()).toContain(".summary-cards");
    expect(readStyles()).toContain(".loading-spinner");
  });
});
