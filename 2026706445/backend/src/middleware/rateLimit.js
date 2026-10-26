export const createRateLimitMiddleware = (config = {}) => {
  const windowMs = Number(config.windowMs ?? 15 * 60 * 1000);
  const max = Number(config.max ?? 300);
  const maxBuckets = Number(config.maxBuckets ?? 10_000);

  if (![windowMs, max, maxBuckets].every((value) => Number.isSafeInteger(value) && value > 0)) {
    throw new Error("Rate limit settings must be positive integers.");
  }

  const buckets = new Map();
  let lastSweep = 0;

  return (req, res, next) => {
    const now = Date.now();
    if (now - lastSweep >= Math.min(windowMs, 60_000)) {
      for (const [client, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(client);
      }
      lastSweep = now;
    }
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const current = buckets.get(key);
    const isActiveWindow = current && current.resetAt > now;
    const resetAt = isActiveWindow ? current.resetAt : now + windowMs;
    const count = isActiveWindow ? current.count + 1 : 1;

    if (!current && buckets.size >= maxBuckets) {
      res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
      res.status(429).json({ message: "Too many requests. Please try again later." });
      return;
    }

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
