const DEFAULT_API_BASE_URL = "http://127.0.0.1:4000/api";

export const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

export const buildApiUrl = (path, query = {}) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return `${API_BASE_URL}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
};

const buildAuthHeaders = (token, headers = {}) => {
  const nextHeaders = { ...headers };

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  return nextHeaders;
};

const readJsonResponse = async (response) => {
  if (!response.ok) {
    let errorBody = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    throw new Error(errorBody?.message || `API request failed: ${response.status}`);
  }

  return response.json();
};

export const requestJson = async (path, query = {}, options = {}) => {
  const fetchImpl = options.fetchImpl || fetch;

  const response = await fetchImpl(buildApiUrl(path, query), {
    headers: buildAuthHeaders(options.token)
  });

  return readJsonResponse(response);
};

const sendJson = async (method, path, payload = {}, options = {}) => {
  const fetchImpl = options.fetchImpl || fetch;
  const response = await fetchImpl(buildApiUrl(path), {
    method,
    headers: buildAuthHeaders(options.token, {
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(payload)
  });

  return readJsonResponse(response);
};

export const postJson = (path, payload = {}, options = {}) => sendJson("POST", path, payload, options);

export const patchJson = (path, payload = {}, options = {}) => sendJson("PATCH", path, payload, options);

export const getProfiles = () => requestJson("/profiles");

export const getProfileBySlug = (slug) => requestJson(`/profiles/${slug}`);

export const getProjects = (filters = {}) => requestJson("/projects", filters);

export const getMyProjects = (token, options = {}) =>
  requestJson("/me/projects", {}, { ...options, token });

export const createMyProject = (token, payload, options = {}) =>
  postJson("/me/projects", payload, { ...options, token });

export const updateMyProject = (token, projectId, payload, options = {}) =>
  patchJson(`/me/projects/${projectId}`, payload, { ...options, token });

export const getMe = (token) => requestJson("/me", {}, { token });

export const saveMyProfile = (token, payload) => postJson("/me/profile", payload, { token });

export const applyToProject = (token, projectId, payload, options = {}) =>
  postJson(`/projects/${projectId}/applications`, payload, { ...options, token });

export const requestContact = (token, slug, payload, options = {}) =>
  postJson(`/profiles/${slug}/contact-requests`, payload, { ...options, token });

export const getContactRequests = (token, options = {}) =>
  requestJson("/me/contact-requests", {}, { ...options, token });

export const getSentContactRequests = (token, options = {}) =>
  requestJson("/me/sent-contact-requests", {}, { ...options, token });

export const decideContactRequest = (token, requestId, payload, options = {}) =>
  patchJson(`/me/contact-requests/${requestId}`, payload, { ...options, token });

export const getSentProjectApplications = (token, options = {}) =>
  requestJson("/me/project-applications", {}, { ...options, token });

export const getOwnedProjectApplications = (token, options = {}) =>
  requestJson("/me/projects/applications", {}, { ...options, token });

export const decideProjectApplication = (token, applicationId, payload, options = {}) =>
  patchJson(`/me/projects/applications/${applicationId}`, payload, { ...options, token });

export const createRecommendationRun = (token, options = {}) =>
  postJson("/me/recommendation-runs", {}, { ...options, token });

export const getPhysicalCardOrders = (token, options = {}) =>
  requestJson("/me/physical-card-orders", {}, { ...options, token });

export const createPhysicalCardOrder = (token, payload, options = {}) =>
  postJson("/me/physical-card-orders", payload, { ...options, token });

export const getAdminPhysicalCardOrders = (token, options = {}) =>
  requestJson("/admin/physical-card-orders", {}, { ...options, token });

export const updateAdminPhysicalCardOrderStatus = (token, orderId, payload, options = {}) =>
  patchJson(`/admin/physical-card-orders/${orderId}`, payload, { ...options, token });

export const getAdminOverview = (token, options = {}) =>
  requestJson("/admin/overview", {}, { ...options, token });

export const getAdminMembers = (token, options = {}) =>
  requestJson("/admin/members", {}, { ...options, token });

export const updateAdminMemberPublication = (token, memberId, payload, options = {}) =>
  patchJson(`/admin/members/${memberId}`, payload, { ...options, token });

export const getAdminRequests = (token, options = {}) =>
  requestJson("/admin/requests", {}, { ...options, token });

export const getAdminAuditLogs = (token, options = {}) =>
  requestJson("/admin/audit-logs", {}, { ...options, token });

export const getProfile = () => requestJson("/profiles/minjun");

export const getRecommendations = () => requestJson("/recommendations/public");
