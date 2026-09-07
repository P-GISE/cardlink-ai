export const emptyProjectExperience = () => ({
  name: "",
  period: "",
  description: "",
  projectUrl: ""
});

export const parseListInput = (value = "") =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const formatListInput = (items = []) => items.filter(Boolean).join(", ");

export const normalizeExternalUrl = (value = "") => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  try {
    const url = new URL(rawValue);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
};

export const normalizeProjects = (projects = []) =>
  projects
    .map((project) => ({
      name: project.name?.trim() || "",
      period: project.period?.trim() || "",
      description: project.description?.trim() || "",
      projectUrl: project.projectUrl?.trim() || project.project_url?.trim() || ""
    }))
    .filter((project) => project.name);

const hasText = (value) => String(value || "").trim().length > 0;

const hasSafeOrEmptyLink = (value) => !hasText(value) || normalizeExternalUrl(value).length > 0;

const profileLinkFields = [
  { key: "websiteUrl", label: "대표 웹사이트" },
  { key: "githubUrl", label: "GitHub" },
  { key: "portfolioUrl", label: "포트폴리오" }
];

export const buildProfileReadiness = (profile = {}) => {
  const skills = parseListInput(profile.skillsText || formatListInput(profile.skills || []));
  const projects = normalizeProjects(profile.projects || []);
  const unsafeLinks = profileLinkFields
    .filter(({ key }) => !hasSafeOrEmptyLink(profile[key]))
    .map(({ label }) => label);

  const items = [
    {
      key: "identity",
      label: "기본 정보",
      complete: hasText(profile.slug) && hasText(profile.displayName),
      detail: "공개 주소와 이름을 입력해주세요."
    },
    {
      key: "story",
      label: "소개 문구",
      complete: hasText(profile.headline) && hasText(profile.bio),
      detail: "한 줄 소개와 소개문을 채워주세요."
    },
    {
      key: "skills",
      label: "기술 스택",
      complete: skills.length > 0,
      detail: "주요 기술을 하나 이상 입력해주세요."
    },
    {
      key: "projects",
      label: "프로젝트 경험",
      complete: projects.length > 0,
      detail: "대표 프로젝트 경험을 하나 이상 추가해주세요."
    },
    {
      key: "safeLinks",
      label: "안전한 링크",
      complete: unsafeLinks.length === 0,
      detail:
        unsafeLinks.length === 0
          ? "외부 링크가 안전합니다."
          : `${unsafeLinks.join(", ")} 링크를 확인해주세요.`
    }
  ];

  const completed = items.filter((item) => item.complete).length;

  return {
    score: Math.round((completed / items.length) * 100),
    completed,
    total: items.length,
    isPublished: Boolean(profile.isPublished),
    items
  };
};
