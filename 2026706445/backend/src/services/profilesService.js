import { badRequest } from "../utils/httpErrors.js";

const mapNameRows = (rows) => rows?.map((row) => row.name) || [];

const externalUrlFields = [
  { field: "websiteUrl", column: "website_url" },
  { field: "githubUrl", column: "github_url" },
  { field: "portfolioUrl", column: "portfolio_url" }
];

const normalizeExternalUrl = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return { value: null, valid: true };

  try {
    const url = new URL(rawValue);
    if (!["http:", "https:"].includes(url.protocol)) {
      return { value: null, valid: false };
    }
    return { value: url.toString(), valid: true };
  } catch {
    return { value: null, valid: false };
  }
};

const normalizeProfileUrls = (payload) => {
  const normalized = {};
  const details = [];

  externalUrlFields.forEach(({ field, column }) => {
    const result = normalizeExternalUrl(payload[field]);
    if (!result.valid) {
      details.push({ field, message: "http 또는 https 주소를 입력해주세요." });
      return;
    }
    normalized[column] = result.value;
  });

  if (details.length > 0) {
    throw badRequest("프로필 링크는 http 또는 https 주소만 사용할 수 있습니다.", details);
  }

  return normalized;
};

const mapProjectRows = (rows = []) =>
  rows.map((row) => ({
    name: row.name,
    description: row.description || "",
    period: row.period || "",
    projectUrl: row.projectUrl || row.project_url || ""
  }));

const normalizeList = (items = []) =>
  [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];

const normalizeProjects = (projects = []) =>
  projects
    .map((project) => ({
      name: project.name?.trim() || "",
      description: project.description?.trim() || "",
      period: project.period?.trim() || "",
      projectUrl: project.projectUrl?.trim() || project.project_url?.trim() || ""
    }))
    .filter((project) => project.name);

const toPublicProfile = (row) => ({
  id: row.id,
  slug: row.slug,
  displayName: row.display_name,
  name: row.display_name,
  role: row.role,
  headline: row.headline,
  bio: row.bio,
  aiSummary: row.ai_summary || row.bio,
  location: row.location,
  avatarUrl: row.avatar_url,
  organization: row.organization,
  position: row.position,
  businessAddress: row.business_address,
  cardTagline: row.card_tagline,
  contactPolicy: row.contact_policy,
  isPublished: row.is_published,
  skills: row.skills || mapNameRows(row.profile_skills),
  interests: row.interests || mapNameRows(row.profile_interests),
  projects: row.projects || mapProjectRows(row.profile_projects)
});

const toPrivateProfile = (row) => ({
  ...toPublicProfile(row),
  userId: row.user_id,
  phone: row.phone,
  websiteUrl: row.website_url,
  email: row.email,
  githubUrl: row.github_url,
  portfolioUrl: row.portfolio_url,
  contact: row.contact
});

export const createProfilesService = (supabase) => ({
  async listPublishedProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, slug, display_name, role, headline, bio, location, avatar_url, organization, position, business_address, card_tagline, contact_policy, is_published, profile_skills(name), profile_interests(name), profile_projects(name, description, period, project_url)"
      )
      .eq("is_published", true)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return data.map(toPublicProfile);
  },

  async getPublishedProfileBySlug(slug) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, slug, display_name, role, headline, bio, location, avatar_url, organization, position, business_address, card_tagline, contact_policy, is_published, profile_skills(name), profile_interests(name), profile_projects(name, description, period, project_url)"
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error) return null;

    return toPublicProfile(data);
  },

  async getProfileByUserId(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, user_id, slug, display_name, role, headline, bio, location, avatar_url, organization, position, phone, website_url, business_address, card_tagline, email, github_url, portfolio_url, contact_policy, is_published, profile_skills(name), profile_interests(name), profile_projects(name, description, period, project_url)"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return toPrivateProfile(data);
  },

  async upsertOwnProfile(user, payload) {
    const normalizedUrls = normalizeProfileUrls(payload);
    const row = {
      user_id: user.id,
      slug: payload.slug,
      display_name: payload.displayName,
      role: payload.role || null,
      headline: payload.headline || null,
      bio: payload.bio || null,
      location: payload.location || null,
      avatar_url: payload.avatarUrl || null,
      organization: payload.organization || null,
      position: payload.position || null,
      phone: payload.phone || null,
      website_url: normalizedUrls.website_url,
      business_address: payload.businessAddress || null,
      card_tagline: payload.cardTagline || null,
      email: payload.email || user.email || null,
      github_url: normalizedUrls.github_url,
      portfolio_url: normalizedUrls.portfolio_url,
      contact_policy: payload.contactPolicy || "approval_required",
      is_published: Boolean(payload.isPublished)
    };

    const { data, error } = await supabase.from("profiles").upsert(row).select().single();

    if (error) throw error;

    const savedProfile = toPrivateProfile(data);

    if (Array.isArray(payload.skills)) {
      const skills = normalizeList(payload.skills);
      await supabase.from("profile_skills").delete().eq("profile_id", data.id);

      if (skills.length > 0) {
        const { error: skillsError } = await supabase.from("profile_skills").insert(
          skills.map((name) => ({
            profile_id: data.id,
            name
          }))
        );

        if (skillsError) throw skillsError;
      }

      savedProfile.skills = skills;
    }

    if (Array.isArray(payload.projects)) {
      const projects = normalizeProjects(payload.projects);
      await supabase.from("profile_projects").delete().eq("profile_id", data.id);

      if (projects.length > 0) {
        const { error: projectsError } = await supabase.from("profile_projects").insert(
          projects.map((project, index) => ({
            profile_id: data.id,
            name: project.name,
            description: project.description || null,
            period: project.period || null,
            project_url: project.projectUrl || null,
            sort_order: index
          }))
        );

        if (projectsError) throw projectsError;
      }

      savedProfile.projects = projects;
    }

    return savedProfile;
  }
});
