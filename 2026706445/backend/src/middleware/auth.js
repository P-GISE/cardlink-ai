import { forbidden, unauthorized } from "../utils/httpErrors.js";

const parseBearerToken = (authorization = "") => {
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

export const createAuthMiddleware = (supabaseAuthClient) => async (req, res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);

    req.user = null;
    req.accessToken = null;

    if (!token) {
      next();
      return;
    }

    const { data, error } = await supabaseAuthClient.auth.getUser(token);

    if (error || !data?.user) {
      next(unauthorized("유효하지 않은 로그인 세션입니다."));
      return;
    }

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireUser = (req) => {
  if (!req.user) {
    throw unauthorized();
  }

  return req.user;
};

export const isAdminUser = (user) => {
  const metadata = user?.app_metadata || {};
  return metadata.role === "admin" || (Array.isArray(metadata.roles) && metadata.roles.includes("admin"));
};

export const requireAdmin = (req) => {
  const user = requireUser(req);

  if (!isAdminUser(user)) {
    throw forbidden("Admin privileges are required.");
  }

  return user;
};
