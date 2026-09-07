import { badRequest, notFound } from "../utils/httpErrors.js";

const toApplication = (row) => ({
  id: row.id,
  projectId: row.project_id,
  applicantProfileId: row.applicant_profile_id,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const toProjectSummary = (row = {}) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  deadline: row.deadline,
  ownerProfileId: row.owner_profile_id
});

const toApplicantSummary = (row = {}) => ({
  id: row.id,
  slug: row.slug,
  displayName: row.display_name,
  role: row.role,
  headline: row.headline
});

const getCallerProfile = async (supabase, user) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!profile) throw badRequest("?꾩옄紐낇븿 ?꾨줈?꾩쓣 癒쇱? ?앹꽦?댁빞 ?⑸땲??");

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

export const createApplicationsService = (supabase) => ({
  async createApplication(user, projectId, payload = {}) {
    const profile = await getCallerProfile(supabase, user);

    const { data, error } = await supabase
      .from("project_applications")
      .insert({
        project_id: projectId,
        applicant_profile_id: profile.id,
        message: payload.message || null,
        status: "pending"
      })
      .select("id, project_id, applicant_profile_id, message, status, created_at, updated_at")
      .single();

    if (error) throw error;

    return toApplication(data);
  },

  async listSentApplications(user) {
    const applicant = await getOptionalCallerProfile(supabase, user);

    if (!applicant) {
      return { count: 0, items: [] };
    }

    const { data: applications, error } = await supabase
      .from("project_applications")
      .select("id, project_id, applicant_profile_id, message, status, created_at, updated_at")
      .eq("applicant_profile_id", applicant.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const projectIds = [...new Set((applications || []).map((application) => application.project_id).filter(Boolean))];
    let projects = [];

    if (projectIds.length > 0) {
      const { data: projectRows, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, status, deadline, owner_profile_id")
        .in("id", projectIds);

      if (projectsError) throw projectsError;
      projects = projectRows || [];
    }

    const items = (applications || []).map((application) => {
      const project = projects.find((item) => item.id === application.project_id);
      return {
        ...toApplication(application),
        project: project ? toProjectSummary(project) : null
      };
    });

    return {
      count: items.length,
      items
    };
  },

  async listOwnedProjectApplications(user) {
    const owner = await getOptionalCallerProfile(supabase, user);

    if (!owner) {
      return { count: 0, items: [] };
    }

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, status, deadline, owner_profile_id")
      .eq("owner_profile_id", owner.id);

    if (projectsError) throw projectsError;

    const projectIds = (projects || []).map((project) => project.id);
    if (projectIds.length === 0) {
      return { count: 0, items: [] };
    }

    const { data: applications, error } = await supabase
      .from("project_applications")
      .select("id, project_id, applicant_profile_id, message, status, created_at, updated_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const applicantIds = [
      ...new Set((applications || []).map((application) => application.applicant_profile_id).filter(Boolean))
    ];
    let applicants = [];

    if (applicantIds.length > 0) {
      const { data: applicantRows, error: applicantsError } = await supabase
        .from("profiles")
        .select("id, slug, display_name, role, headline")
        .in("id", applicantIds);

      if (applicantsError) throw applicantsError;
      applicants = applicantRows || [];
    }

    const items = (applications || []).map((application) => {
      const project = projects.find((item) => item.id === application.project_id);
      const applicantProfile = applicants.find((item) => item.id === application.applicant_profile_id);

      return {
        ...toApplication(application),
        project: project ? toProjectSummary(project) : null,
        applicant: applicantProfile ? toApplicantSummary(applicantProfile) : null
      };
    });

    return {
      count: items.length,
      items
    };
  },

  async decideApplication(user, applicationId, payload = {}) {
    const nextStatus = payload.status;

    if (!["accepted", "rejected"].includes(nextStatus)) {
      throw badRequest("Project applications can only be accepted or rejected.");
    }

    const owner = await getCallerProfile(supabase, user);

    const { data: application, error: applicationError } = await supabase
      .from("project_applications")
      .select("id, project_id, applicant_profile_id, message, status, created_at, updated_at")
      .eq("id", applicationId)
      .maybeSingle();

    if (applicationError) throw applicationError;
    if (!application) throw notFound("Project application not found.");

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, status, deadline, owner_profile_id")
      .eq("id", application.project_id)
      .eq("owner_profile_id", owner.id)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) throw notFound("Project application not found.");

    const { data, error } = await supabase
      .from("project_applications")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", applicationId)
      .select("id, project_id, applicant_profile_id, message, status, created_at, updated_at")
      .single();

    if (error) throw error;

    return {
      ...toApplication(data),
      project: toProjectSummary(project)
    };
  }
});
