import { badRequest, notFound } from "../utils/httpErrors.js";

const toContactRequest = (row) => ({
  id: row.id,
  targetProfileId: row.target_profile_id,
  requesterProfileId: row.requester_profile_id,
  status: row.status,
  requestType: row.request_type,
  message: row.message,
  decidedAt: row.decided_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const toContact = (row) => ({
  email: row.email,
  githubUrl: row.github_url,
  portfolioUrl: row.portfolio_url
});

const toRequester = (row = {}) => ({
  id: row.id,
  slug: row.slug,
  displayName: row.display_name,
  role: row.role,
  headline: row.headline
});

const toTarget = (row = {}, includeContact = false) => ({
  id: row.id,
  slug: row.slug,
  displayName: row.display_name,
  role: row.role,
  headline: row.headline,
  contact: includeContact ? toContact(row) : undefined
});

const toReceivedContactRequest = (row, requesterProfiles = []) => {
  const requester = requesterProfiles.find((profile) => profile.id === row.requester_profile_id);

  return {
    ...toContactRequest(row),
    requester: requester ? toRequester(requester) : null
  };
};

const toSentContactRequest = (row, targetProfiles = []) => {
  const target = targetProfiles.find((profile) => profile.id === row.target_profile_id);

  return {
    ...toContactRequest(row),
    target: target ? toTarget(target, row.status === "approved") : null
  };
};

const getCallerProfile = async (supabase, user) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw badRequest("Create your profile before using contact requests.");

  return data;
};

const getOptionalCallerProfile = async (supabase, user) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const createContactService = (supabase) => ({
  async listReceivedContactRequests(user) {
    const owner = await getOptionalCallerProfile(supabase, user);

    if (!owner) {
      return { count: 0, items: [] };
    }

    const { data: requests, error } = await supabase
      .from("contact_requests")
      .select("id, target_profile_id, requester_profile_id, status, request_type, message, decided_at, created_at, updated_at")
      .eq("target_profile_id", owner.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const requesterIds = [...new Set((requests || []).map((request) => request.requester_profile_id).filter(Boolean))];
    let requesterProfiles = [];

    if (requesterIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, slug, display_name, role, headline")
        .in("id", requesterIds);

      if (profilesError) throw profilesError;
      requesterProfiles = profiles || [];
    }

    const items = (requests || []).map((request) => toReceivedContactRequest(request, requesterProfiles));

    return {
      count: items.length,
      items
    };
  },

  async listSentContactRequests(user) {
    const requester = await getOptionalCallerProfile(supabase, user);

    if (!requester) {
      return { count: 0, items: [] };
    }

    const { data: requests, error } = await supabase
      .from("contact_requests")
      .select("id, target_profile_id, requester_profile_id, status, request_type, message, decided_at, created_at, updated_at")
      .eq("requester_profile_id", requester.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const targetIds = [...new Set((requests || []).map((request) => request.target_profile_id).filter(Boolean))];
    let targetProfiles = [];

    if (targetIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, slug, display_name, role, headline, email, github_url, portfolio_url")
        .in("id", targetIds);

      if (profilesError) throw profilesError;
      targetProfiles = profiles || [];
    }

    const items = (requests || []).map((request) => toSentContactRequest(request, targetProfiles));

    return {
      count: items.length,
      items
    };
  },

  async createContactRequest(user, slug, payload = {}) {
    const requester = await getCallerProfile(supabase, user);

    const { data: target, error: targetError } = await supabase
      .from("profiles")
      .select("id, slug, display_name, email, github_url, portfolio_url, contact_policy")
      .eq("slug", slug)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) throw notFound("Profile not found.");
    if (target.id === requester.id) throw badRequest("You cannot request contact with your own profile.");

    const isInstant = target.contact_policy === "instant";
    const requestPayload = {
      target_profile_id: target.id,
      requester_profile_id: requester.id,
      status: isInstant ? "approved" : "pending",
      request_type: isInstant ? "instant_reveal" : "approval_request",
      message: payload.message || null,
      decided_at: isInstant ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
      .from("contact_requests")
      .insert(requestPayload)
      .select("id, target_profile_id, requester_profile_id, status, request_type, message, decided_at, created_at, updated_at")
      .single();

    if (error) throw error;

    const request = toContactRequest(data);

    if (!isInstant) {
      return {
        status: "pending",
        request
      };
    }

    return {
      status: "approved",
      request,
      contact: toContact(target)
    };
  },

  async decideContactRequest(user, requestId, payload = {}) {
    const nextStatus = payload.status;

    if (!["approved", "rejected"].includes(nextStatus)) {
      throw badRequest("Contact requests can only be approved or rejected.");
    }

    const owner = await getCallerProfile(supabase, user);

    const { data, error } = await supabase
      .from("contact_requests")
      .update({
        status: nextStatus,
        decided_at: new Date().toISOString()
      })
      .eq("id", requestId)
      .eq("target_profile_id", owner.id)
      .select("id, target_profile_id, requester_profile_id, status, request_type, message, decided_at, created_at, updated_at")
      .single();

    if (error) throw error;

    return toContactRequest(data);
  }
});
