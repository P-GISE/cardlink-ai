import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { createAdminService } from "../services/adminService.js";

export const createAdminRouter = ({ supabase }) => {
  const router = Router();
  const adminService = createAdminService(supabase);

  router.get("/admin/overview", async (req, res, next) => {
    try {
      requireAdmin(req);
      res.json(await adminService.getOverview());
    } catch (error) {
      next(error);
    }
  });

  router.get("/admin/members", async (req, res, next) => {
    try {
      requireAdmin(req);
      res.json(await adminService.listMembers());
    } catch (error) {
      next(error);
    }
  });

  router.patch("/admin/members/:id", async (req, res, next) => {
    try {
      const adminUser = requireAdmin(req);
      res.json(await adminService.updateMemberPublication(adminUser, req.params.id, req.body));
    } catch (error) {
      next(error);
    }
  });

  router.get("/admin/requests", async (req, res, next) => {
    try {
      requireAdmin(req);
      res.json(await adminService.listRequests());
    } catch (error) {
      next(error);
    }
  });

  router.get("/admin/audit-logs", async (req, res, next) => {
    try {
      requireAdmin(req);
      res.json(await adminService.listAuditLogs());
    } catch (error) {
      next(error);
    }
  });

  return router;
};
