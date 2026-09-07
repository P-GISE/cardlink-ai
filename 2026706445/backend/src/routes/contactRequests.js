import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { createContactService } from "../services/contactService.js";

export const createContactRequestsRouter = ({ supabase }) => {
  const router = Router();
  const contactService = createContactService(supabase);

  router.get("/me/contact-requests", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const result = await contactService.listReceivedContactRequests(user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/me/sent-contact-requests", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const result = await contactService.listSentContactRequests(user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/profiles/:slug/contact-requests", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const result = await contactService.createContactRequest(user, req.params.slug, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/me/contact-requests/:id", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const result = await contactService.decideContactRequest(user, req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
