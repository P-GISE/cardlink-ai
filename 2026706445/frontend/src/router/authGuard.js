import { getAccessToken } from "../services/auth.js";

export const resolveAuthRedirect = async (to, getToken = getAccessToken) => {
  if (!to.meta?.requiresAuth) return true;

  const token = await getToken();
  if (token) return true;

  return {
    name: "login",
    query: { redirect: to.fullPath }
  };
};

export const registerAuthGuard = (router) => {
  router.beforeEach((to) => resolveAuthRedirect(to));
};
