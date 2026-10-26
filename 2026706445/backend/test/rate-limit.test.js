import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimitMiddleware } from "../src/middleware/rateLimit.js";

test("limiter bounds client buckets and recovers after their expiry", (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: 0 });
  const limiter = createRateLimitMiddleware({ windowMs: 1000, max: 2, maxBuckets: 2 });
  const call = (ip) => {
    let code = 200;
    const response = {
      setHeader() {},
      status(value) { code = value; return this; },
      json() {}
    };
    limiter({ ip }, response, () => {});
    return code;
  };
  assert.equal(call("198.51.100.1"), 200);
  assert.equal(call("198.51.100.2"), 200);
  assert.equal(call("198.51.100.3"), 429);
  assert.equal(call("198.51.100.1"), 200);
  context.mock.timers.tick(1001);
  assert.equal(call("198.51.100.3"), 200);
});

test("invalid limiter settings fail closed during startup", () => {
  assert.throws(() => createRateLimitMiddleware({ max: -1 }), /positive integers/);
});
