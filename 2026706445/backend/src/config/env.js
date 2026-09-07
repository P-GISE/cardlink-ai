const REQUIRED_KEYS = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

const parseOrigins = (value) => {
  if (!value) return ["http://localhost:5173", "http://127.0.0.1:5173"];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getMissingKeys = (source) =>
  REQUIRED_KEYS.filter((key) => !source[key] || String(source[key]).trim() === "");

const requireKeys = (source) => {
  const missing = REQUIRED_KEYS.filter((key) => !source[key] || String(source[key]).trim() === "");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

export const loadEnv = (source = process.env) => {
  const nodeEnv = source.NODE_ENV || "development";
  const missingSupabaseKeys = getMissingKeys(source);
  const enableLocalAuth = source.ENABLE_LOCAL_AUTH === "true";
  const corsOrigins = parseOrigins(source.CORS_ORIGIN);

  if (nodeEnv === "production") {
    requireKeys(source);

    if (enableLocalAuth) {
      throw new Error("ENABLE_LOCAL_AUTH must not be enabled in production.");
    }

    if (corsOrigins.includes("*")) {
      throw new Error("CORS_ORIGIN must not contain * in production.");
    }
  }

  if (missingSupabaseKeys.length > 0 && !enableLocalAuth) {
    throw new Error("Local auth fallback requires ENABLE_LOCAL_AUTH=true when Supabase values are missing.");
  }

  return {
    port: Number(source.PORT || 4000),
    nodeEnv,
    corsOrigins,
    requestBodyLimit: source.REQUEST_BODY_LIMIT || "32kb",
    rateLimit: {
      windowMs: parsePositiveInteger(source.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      max: parsePositiveInteger(source.RATE_LIMIT_MAX, nodeEnv === "production" ? 300 : 1000)
    },
    supabase: {
      url: source.SUPABASE_URL || "",
      anonKey: source.SUPABASE_ANON_KEY || "",
      serviceRoleKey: source.SUPABASE_SERVICE_ROLE_KEY || "",
      isConfigured: missingSupabaseKeys.length === 0,
      enableLocalAuth
    }
  };
};
