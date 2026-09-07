import test from "node:test";
import assert from "node:assert/strict";
import { createAuthMiddleware, requireUser } from "../src/middleware/auth.js";
import { HttpError } from "../src/utils/httpErrors.js";

test("createAuthMiddleware attaches user when bearer token is valid", async () => {
  const middleware = createAuthMiddleware({
    auth: {
      getUser: async (token) => ({
        data: { user: { id: "user-1", email: "a@example.test" } },
        error: null,
        token
      })
    }
  });
  const req = { headers: { authorization: "Bearer valid-token" } };

  await middleware(req, {}, () => {});

  assert.equal(req.user.id, "user-1");
  assert.equal(req.accessToken, "valid-token");
});

test("createAuthMiddleware leaves anonymous requests alone", async () => {
  const middleware = createAuthMiddleware({
    auth: {
      getUser: async () => {
        throw new Error("should not be called");
      }
    }
  });
  const req = { headers: {} };

  await middleware(req, {}, () => {});

  assert.equal(req.user, null);
  assert.equal(req.accessToken, null);
});

test("requireUser throws 401 for anonymous requests", () => {
  assert.throws(() => requireUser({ user: null }), HttpError);
});
