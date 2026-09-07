import { supabase } from "./supabase.js";

const LOCAL_AUTH_STORAGE_KEY = "cardlink.localAuthSession";
const LOCAL_AUTH_ACCOUNTS_KEY = "cardlink.localAuthAccounts";
const LOCAL_AUTH_TOKEN = "local-dev-token";
const LOCAL_ADMIN_AUTH_TOKEN = "local-admin-token";

const getStorage = (options = {}) => {
  if (options.storage) return options.storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
};

const readLocalSession = (options = {}) => {
  const storage = getStorage(options);
  const rawSession = storage?.getItem(LOCAL_AUTH_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession);

    if (session.provider === "email") {
      const email = normalizeEmail(session.user?.email);
      const account = readLocalAccounts(options)[email];

      if (!account) {
        storage?.removeItem(LOCAL_AUTH_STORAGE_KEY);
        return null;
      }
    }

    return session;
  } catch {
    storage?.removeItem(LOCAL_AUTH_STORAGE_KEY);
    return null;
  }
};

const readLocalAccounts = (options = {}) => {
  const rawAccounts = getStorage(options)?.getItem(LOCAL_AUTH_ACCOUNTS_KEY);
  if (!rawAccounts) return {};

  try {
    return JSON.parse(rawAccounts);
  } catch {
    getStorage(options)?.removeItem(LOCAL_AUTH_ACCOUNTS_KEY);
    return {};
  }
};

const writeLocalAccounts = (accounts, options = {}) => {
  getStorage(options)?.setItem(LOCAL_AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const sanitizeRedirectPath = (value, fallback = "/profile/edit") => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const rawPath = String(rawValue || "").trim();

  if (!rawPath || !rawPath.startsWith("/") || rawPath.startsWith("//") || rawPath.includes("\\")) {
    return fallback;
  }

  try {
    const url = new URL(rawPath, "https://cardlink.local");
    if (url.origin !== "https://cardlink.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
};

const buildAuthCallbackUrl = (redirectPath = "/profile/edit") => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ next: sanitizeRedirectPath(redirectPath) });
  return `${origin}/auth/callback?${params.toString()}`;
};

const buildSignupMetadata = (options = {}) => {
  const data = {};
  const fullName = String(options.fullName || "").trim();

  if (fullName) data.full_name = fullName;
  if (options.termsAcceptedAt) data.terms_accepted_at = options.termsAcceptedAt;
  if (options.privacyAcceptedAt) data.privacy_accepted_at = options.privacyAcceptedAt;

  return data;
};

export const isAdminUser = (user) => {
  const metadata = user?.app_metadata || {};
  return metadata.role === "admin" || (Array.isArray(metadata.roles) && metadata.roles.includes("admin"));
};

const createLocalSession = (email, provider = "email", options = {}) => {
  const normalizedEmail = normalizeEmail(email) || `${provider}@local.test`;
  const fullName = String(options.fullName || "").trim();
  const isLocalAdmin = normalizedEmail.startsWith("admin@");
  const session = {
    access_token: isLocalAdmin ? LOCAL_ADMIN_AUTH_TOKEN : LOCAL_AUTH_TOKEN,
    user: {
      id: isLocalAdmin ? "local-admin" : "local-user",
      email: normalizedEmail,
      app_metadata: isLocalAdmin ? { role: "admin" } : {},
      user_metadata: {
        full_name: fullName
      }
    },
    provider
  };

  getStorage(options)?.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(session));

  return {
    data: { session, user: session.user },
    error: null,
    local: true
  };
};

export const getAccessToken = async (client = supabase, options = {}) => {
  if (!client) return readLocalSession(options)?.access_token || null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token || null;
};

export const getCurrentUser = async (client = supabase, options = {}) => {
  if (!client) return readLocalSession(options)?.user || null;

  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user || null;
};

export const signInWithProvider = async (client = supabase, provider, options = {}) => {
  if (!client) return createLocalSession(`${provider}@local.test`, provider, options);

  return client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: options.redirectTo || buildAuthCallbackUrl(options.redirectPath)
    }
  });
};

export const signInWithPassword = async (client = supabase, email, password, options = {}) => {
  if (!client) {
    const normalizedEmail = normalizeEmail(email);
    const account = readLocalAccounts(options)[normalizedEmail];

    if (!account) {
      return {
        data: { session: null, user: null },
        error: { message: "가입된 계정이 없습니다. 먼저 회원가입을 진행해주세요." },
        local: true
      };
    }

    if (account.password !== password) {
      return {
        data: { session: null, user: null },
        error: { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        local: true
      };
    }

    return createLocalSession(normalizedEmail, "email", {
      ...options,
      fullName: account.fullName
    });
  }
  return client.auth.signInWithPassword({ email, password });
};

export const signUpWithPassword = async (client = supabase, email, password, options = {}) => {
  if (!client) {
    const normalizedEmail = normalizeEmail(email);
    const accounts = readLocalAccounts(options);
    accounts[normalizedEmail] = {
      email: normalizedEmail,
      password,
      fullName: String(options.fullName || "").trim()
    };
    writeLocalAccounts(accounts, options);
    return createLocalSession(normalizedEmail, "email", options);
  }

  const metadata = buildSignupMetadata(options);

  return client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options.emailRedirectTo || buildAuthCallbackUrl(options.redirectPath),
      data: metadata
    }
  });
};

export const signOut = async (client = supabase, options = {}) => {
  if (!client) {
    getStorage(options)?.removeItem(LOCAL_AUTH_STORAGE_KEY);
    return;
  }
  await client.auth.signOut();
};

export const completeAuthCallback = async (client = supabase, url = window.location.href) => {
  const currentUrl = new URL(url);
  const redirectPath = sanitizeRedirectPath(currentUrl.searchParams.get("next"));

  if (!client) {
    return { error: null, redirectPath };
  }

  const code = currentUrl.searchParams.get("code");
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    return { error, redirectPath: error ? "/login" : redirectPath };
  }

  const tokenHash = currentUrl.searchParams.get("token_hash");
  const type = currentUrl.searchParams.get("type");
  if (tokenHash && type) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });
    return { error, redirectPath: error ? "/login" : redirectPath };
  }

  const { data, error } = await client.auth.getSession();
  return {
    error,
    redirectPath: !error && data.session ? redirectPath : "/login"
  };
};
