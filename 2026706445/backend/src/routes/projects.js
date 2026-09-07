import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { createProjectsService } from "../services/projectsService.js";

export const createProjectsRouter = ({ supabase }) => {
  const router = Router();
  const projectsService = createProjectsService(supabase);

  router.get("/projects", async (req, res, next) => {
    try {
      const items = await projectsService.listPublishedProjects({
        skill: req.query.skill,
        interest: req.query.interest
      });
      res.json({ count: items.length, items });
    } catch (error) {
      next(error);
    }
  });

  router.get("/me/projects", async (req, res, next) => {
    try {
      const user = requireUser(req);
      res.json(await projectsService.listOwnProjects(user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/me/projects", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const project = await projectsService.createProject(user, req.body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/me/projects/:id", async (req, res, next) => {
    try {
      const user = requireUser(req);
      res.json(await projectsService.updateProject(user, req.params.id, req.body));
    } catch (error) {
      next(error);
    }
  });

  return router;
};
