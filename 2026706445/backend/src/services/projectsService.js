import { badRequest, notFound } from "../utils/httpErrors.js";

const allowedProjectStatuses = new Set(["planning", "recruiting", "closed"]);
const projectRelationTables = {
  roles: "project_roles",
  skills: "project_skills",
  interests: "project_interests"
};

const toPublicProject = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  deadline: row.deadline,
  roles: row.roles || row.project_roles?.map((role) => role.name) || [],
  skills: row.skills || row.project_skills?.map((skill) => skill.name) || [],
  interests: row.interests || row.project_interests?.map((interest) => interest.name) || [],
  owner: row.profiles
    ? {
        displayName: row.profiles.display_name,
        slug: row.profiles.slug
      }
    : null
});

const toManagedProject = (row, relations = {}) => ({
  id: row.id,
  ownerProfileId: row.owner_profile_id,
  title: row.title,
  description: row.description,
  status: row.status,
  deadline: row.deadline,
  isPublished: Boolean(row.is_published),
  roles: relations.roles || row.roles || row.project_roles?.map((role) => role.name) || [],
  skills: relations.skills || row.skills || row.project_skills?.map((skill) => skill.name) || [],
  interests: relations.interests || row.interests || row.project_interests?.map((interest) => interest.name) || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const includesIgnoreCase = (items = [], value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return true;

  return items.some((item) => String(item || "").trim().toLowerCase() === normalizedValue);
};

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

const cleanTagList = (values = []) => {
  if (!Array.isArray(values)) return [];

  return [...new Set(values.map((value) => cleanText(value, 40)).filter(Boolean))].slice(0, 12);
};

const validateDeadline = (value) => {
  const deadline = cleanText(value, 20);
  if (!deadline) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    throw badRequest("Project deadline must be YYYY-MM-DD.");
  }
  return deadline;
};

const buildProjectFields = (payload = {}, { partial = false } = {}) => {
  const fields = {};

  if (!partial || payload.title !== undefined) {
    const title = cleanText(payload.title, 120);
    if (!title) throw badRequest("Project title is required.");
    fields.title = title;
  }

  if (!partial || payload.description !== undefined) {
    const description = cleanText(payload.description, 2000);
    if (!description) throw badRequest("Project description is required.");
    fields.description = description;
  }

  if (!partial || payload.status !== undefined) {
    const status = cleanText(payload.status || "recruiting", 40);
    if (!allowedProjectStatuses.has(status)) {
      throw badRequest("Unsupported project status.");
    }
    fields.status = status;
  }

  if (!partial || payload.deadline !== undefined) {
    fields.deadline = validateDeadline(payload.deadline);
  }

  if (!partial || payload.isPublished !== undefined) {
    if (payload.isPublished !== undefined && typeof payload.isPublished !== "boolean") {
      throw badRequest("isPublished must be a boolean.");
    }
    fields.is_published = payload.isPublished !== false;
  }

  return fields;
};

const getCallerProfile = async (supabase, user) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!profile) throw badRequest("전자명함 프로필을 먼저 생성해야 합니다.");

  return profile;
};

const getOptionalCallerProfile = async (supabase, user) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return profile;
};

const loadProjectRelations = async (supabase, projectId) => {
  const entries = await Promise.all(
    Object.entries(projectRelationTables).map(async ([key, tableName]) => {
      const { data, error } = await supabase.from(tableName).select("name").eq("project_id", projectId);
      if (error) throw error;
      return [key, (data || []).map((item) => item.name)];
    })
  );

  return Object.fromEntries(entries);
};

const replaceProjectRelation = async (supabase, projectId, tableName, values) => {
  await supabase.from(tableName).delete().eq("project_id", projectId);

  if (values.length === 0) return;

  const { error } = await supabase.from(tableName).insert(
    values.map((name) => ({
      project_id: projectId,
      name
    }))
  );

  if (error) throw error;
};

const replaceProjectRelations = async (supabase, projectId, payload, { partial = false } = {}) => {
  const nextRelations = {};

  for (const [key, tableName] of Object.entries(projectRelationTables)) {
    if (!partial || payload[key] !== undefined) {
      const values = cleanTagList(payload[key] || []);
      await replaceProjectRelation(supabase, projectId, tableName, values);
      nextRelations[key] = values;
    }
  }

  return nextRelations;
};

const getOwnedProject = async (supabase, ownerProfileId, projectId) => {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, description, status, deadline, is_published, owner_profile_id, created_at, updated_at")
    .eq("id", projectId)
    .eq("owner_profile_id", ownerProfileId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFound("Project not found.");

  return data;
};

export const createProjectsService = (supabase) => ({
  async listPublishedProjects(filters = {}) {
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, title, description, status, deadline, is_published, owner_profile_id, profiles(display_name, slug), project_roles(name), project_skills(name), project_interests(name)"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data
      .map(toPublicProject)
      .filter(
        (project) =>
          includesIgnoreCase(project.skills, filters.skill) &&
          includesIgnoreCase(project.interests, filters.interest)
      );
  },

  async listOwnProjects(user) {
    const profile = await getOptionalCallerProfile(supabase, user);

    if (!profile) {
      return { count: 0, items: [] };
    }

    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, title, description, status, deadline, is_published, owner_profile_id, created_at, updated_at, project_roles(name), project_skills(name), project_interests(name)"
      )
      .eq("owner_profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      count: (data || []).length,
      items: (data || []).map((project) => toManagedProject(project))
    };
  },

  async createProject(user, payload = {}) {
    const profile = await getCallerProfile(supabase, user);
    const fields = buildProjectFields(payload);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...fields,
        owner_profile_id: profile.id
      })
      .select("id, title, description, status, deadline, is_published, owner_profile_id, created_at, updated_at")
      .single();

    if (error) throw error;

    const relations = await replaceProjectRelations(supabase, data.id, payload);
    return toManagedProject(data, relations);
  },

  async updateProject(user, projectId, payload = {}) {
    const profile = await getCallerProfile(supabase, user);
    await getOwnedProject(supabase, profile.id, projectId);

    const fields = buildProjectFields(payload, { partial: true });
    const { data, error } = await supabase
      .from("projects")
      .update({
        ...fields,
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId)
      .eq("owner_profile_id", profile.id)
      .select("id, title, description, status, deadline, is_published, owner_profile_id, created_at, updated_at")
      .single();

    if (error) throw error;
    if (!data) throw notFound("Project not found.");

    await replaceProjectRelations(supabase, projectId, payload, { partial: true });
    const relations = await loadProjectRelations(supabase, projectId);

    return toManagedProject(data, relations);
  }
});
