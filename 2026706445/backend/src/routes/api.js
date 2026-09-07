import { Router } from "express";
import { profile, projects, recommendations } from "../data/mockData.js";

const router = Router();

const includesIgnoreCase = (items, value) => {
  if (!value) return true;
  const normalizedValue = value.toLowerCase();
  return items.some((item) => item.toLowerCase() === normalizedValue);
};

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ai-card-platform-api",
    timestamp: new Date().toISOString()
  });
});

router.get("/profile", (req, res) => {
  res.json(profile);
});

router.get("/projects", (req, res) => {
  const { skill = "", interest = "" } = req.query;
  const filteredProjects = projects.filter(
    (project) =>
      includesIgnoreCase(project.skills, String(skill)) &&
      includesIgnoreCase(project.interests, String(interest))
  );

  res.json({
    count: filteredProjects.length,
    filters: {
      skill: skill || null,
      interest: interest || null
    },
    items: filteredProjects
  });
});

router.get("/recommendations", (req, res) => {
  res.json({
    count: recommendations.length,
    items: recommendations
  });
});

export default router;

