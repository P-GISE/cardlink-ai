import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { createApplicationsService } from "../services/applicationsService.js";

export const createApplicationsRouter = ({ supabase }) => {
  const router = Router();
  const applicationsService = createApplicationsService(supabase);

  router.get("/me/project-applications", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const result = await applicationsService.listSentApplications(user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/me/projects/applications", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const result = await applicationsService.listOwnedProjectApplications(user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/me/projects/applications/:id", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const application = await applicationsService.decideApplication(user, req.params.id, req.body);
      res.json(application);
    } catch (error) {
      next(error);
    }
  });

  router.post("/projects/:id/applications", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const application = await applicationsService.createApplication(user, req.params.id, req.body);
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
