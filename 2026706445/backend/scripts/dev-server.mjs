process.env.NODE_ENV ||= "development";
process.env.ENABLE_LOCAL_AUTH ||= "true";
process.env.REQUEST_BODY_LIMIT ||= "32kb";
process.env.CORS_ORIGIN ||= "http://localhost:5173,http://127.0.0.1:5173";

await import("../src/server.js");
