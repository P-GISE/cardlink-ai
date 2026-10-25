import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { loadEnv } from "./config/env.js";
import { createSupabaseAnonClient, createSupabaseServiceClient } from "./db/supabase.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createRateLimitMiddleware } from "./middleware/rateLimit.js";
import healthRouter from "./routes/health.js";
import { createApplicationsRouter } from "./routes/applications.js";
import { createAdminRouter } from "./routes/admin.js";
import { createContactRequestsRouter } from "./routes/contactRequests.js";
import { createPhysicalCardsRouter } from "./routes/physicalCards.js";
import { createProfilesRouter } from "./routes/profiles.js";
import { createProjectsRouter } from "./routes/projects.js";
import { createRecommendationsRouter } from "./routes/recommendations.js";
import { HttpError } from "./utils/httpErrors.js";

const isLocalDevelopmentOrigin = (origin, env) => {
  if (env.nodeEnv === "production") return false;

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
};

export const createApp = (options = {}) => {
  const env = options.env || loadEnv();
  const app = express();
  const enableLogger = options.logger ?? env.nodeEnv !== "test";
  const supabase = options.supabase || createSupabaseServiceClient(env);
  const supabaseAuth = options.supabaseAuth || createSupabaseAnonClient(env);

  app.disable("x-powered-by");
  app.set("trust proxy", env.trustedProxyIps || []);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          connectSrc: ["'self'", ...(options.staticDir && env.supabase?.url ? [new URL(env.supabase.url).origin] : [])],
          imgSrc: ["'self'", "data:", "https:"],
          frameAncestors: ["'none'"]
        }
      },
      crossOriginResourcePolicy: false
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          env.corsOrigins.includes("*") ||
          env.corsOrigins.includes(origin) ||
          isLocalDevelopmentOrigin(origin, env)
        ) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    })
  );
  app.use("/api", healthRouter);
  app.use("/api", createRateLimitMiddleware(env.rateLimit));
  app.use(express.json({ limit: env.requestBodyLimit || "32kb" }));
  app.use(createAuthMiddleware(supabaseAuth));

  if (enableLogger) {
    app.use(morgan("dev"));
  }

  app.use("/api", createProfilesRouter({ supabase }));
  app.use("/api", createProjectsRouter({ supabase }));
  app.use("/api", createApplicationsRouter({ supabase }));
  app.use("/api", createContactRequestsRouter({ supabase }));
  app.use("/api", createPhysicalCardsRouter({ supabase }));
  app.use("/api", createRecommendationsRouter({ supabase }));
  app.use("/api", createAdminRouter({ supabase }));

  if (options.staticDir) {
    app.use(express.static(options.staticDir));
    app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
      if (req.path.includes(".") && !/^\/profiles\/[^/]+\/?$/.test(req.path)) return next();
      res.sendFile("index.html", { root: options.staticDir });
    });
  }

  app.use((req, res) => {
    res.status(404).json({
      message: "API route not found.",
      path: req.originalUrl
    });
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const isHttpError = err instanceof HttpError;
    const statusCode = isHttpError ? err.statusCode : err.status || err.statusCode || 500;
    const isPayloadTooLarge = statusCode === 413;
    const shouldExposeError = isHttpError || isPayloadTooLarge || env.nodeEnv !== "production";
    const message = shouldExposeError
      ? isPayloadTooLarge
        ? "Request body is too large."
        : err.message || "Server error."
      : "Server error.";

    res.status(statusCode).json({
      message,
      details: shouldExposeError ? err.details : undefined,
      detail: env.nodeEnv === "production" ? undefined : err.message
    });
  });

  return app;
};
