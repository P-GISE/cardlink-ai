export const createRateLimitMiddleware = (config = {}) => {
  const windowMs = Number(config.windowMs || 15 * 60 * 1000);
  const max = Number(config.max || 300);

  if (!Number.isFinite(windowMs) || windowMs <= 0 || !Number.isFinite(max) || max <= 0) {
    return (req, res, next) => next();
  }

  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const current = buckets.get(key);
    const isActiveWindow = current && current.resetAt > now;
    const resetAt = isActiveWindow ? current.resetAt : now + windowMs;
    const count = isActiveWindow ? current.count + 1 : 1;

    buckets.set(key, { count, resetAt });

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

    if (count > max) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((resetAt - now) / 1000))));
      res.status(429).json({ message: "Too many requests. Please try again later." });
      return;
    }

    next();
  };
};
