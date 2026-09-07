import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { createProfilesService } from "../services/profilesService.js";
import { notFound } from "../utils/httpErrors.js";

export const createProfilesRouter = ({ supabase }) => {
  const router = Router();
  const profilesService = createProfilesService(supabase);

  router.get("/me", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const profile = await profilesService.getProfileByUserId(user.id);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  router.post("/me/profile", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const profile = await profilesService.upsertOwnProfile(user, req.body);
      res.status(201).json(profile);
    } catch (error) {
      next(error);
    }
  });

  router.get("/profiles", async (req, res, next) => {
    try {
      const items = await profilesService.listPublishedProfiles();
      res.json({ count: items.length, items });
    } catch (error) {
      next(error);
    }
  });

  router.get("/profiles/:slug", async (req, res, next) => {
    try {
      const profile = await profilesService.getPublishedProfileBySlug(req.params.slug);
      if (!profile) throw notFound("프로필을 찾을 수 없습니다.");
      res.json(profile);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
