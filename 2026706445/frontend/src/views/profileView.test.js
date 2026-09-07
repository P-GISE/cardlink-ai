import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));
const profileViewSource = readFileSync(resolve(currentDir, "ProfileView.vue"), "utf8");
const profileEditViewSource = readFileSync(resolve(currentDir, "ProfileEditView.vue"), "utf8");

describe("ProfileView", () => {
  it("shows an edit action after a business card exists", () => {
    expect(profileViewSource).toContain('to="/profile/edit"');
    expect(profileViewSource).toContain("전자명함 수정");
  });

  it("redirects anonymous users away from the profile editor", () => {
    expect(profileEditViewSource).toContain("redirectToLogin");
    expect(profileEditViewSource).toContain("redirect: \"/profile/edit\"");
  });

  it("lets users edit skills and project experience", () => {
    expect(profileEditViewSource).toContain("개발 스택");
    expect(profileEditViewSource).toContain("프로젝트 경험");
    expect(profileEditViewSource).toContain("addProjectExperience");
    expect(profileEditViewSource).toContain("normalizeProjects");
  });

  it("prefills a new profile with verified account metadata", () => {
    expect(profileEditViewSource).toContain("getCurrentUser");
    expect(profileEditViewSource).toContain("applyAccountDefaults");
    expect(profileEditViewSource).toContain("user_metadata?.full_name");
  });

  it("surfaces profile readiness in the editor before publishing", () => {
    expect(profileEditViewSource).toContain("ProfileReadinessPanel");
    expect(profileEditViewSource).toContain("profileReadiness");
    expect(profileEditViewSource).toContain("buildProfileReadiness");
  });
});
