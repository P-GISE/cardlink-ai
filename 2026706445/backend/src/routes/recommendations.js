import { Router } from "express";
import { publicRecommendations } from "../db/localSupabase.js";
import { requireUser } from "../middleware/auth.js";
import { createRecommendationService } from "../services/recommendationService.js";

export const createRecommendationsRouter = ({ supabase }) => {
  const router = Router();
  const recommendationService = createRecommendationService(supabase);

  router.post("/me/recommendation-runs", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const result = await recommendationService.createRun(user);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/recommendations/public", (req, res) => {
    res.json({
      count: publicRecommendations.length,
      items: publicRecommendations
    });
  });

  return router;
};
