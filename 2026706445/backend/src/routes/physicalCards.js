import { Router } from "express";
import { requireAdmin, requireUser } from "../middleware/auth.js";
import { createAdminService } from "../services/adminService.js";
import { createPhysicalCardsService } from "../services/physicalCardsService.js";

export const createPhysicalCardsRouter = ({ supabase }) => {
  const router = Router();
  const adminService = createAdminService(supabase);
  const physicalCardsService = createPhysicalCardsService(supabase);

  router.get("/admin/physical-card-orders", async (req, res, next) => {
    try {
      requireAdmin(req);
      const items = await physicalCardsService.listAllOrders();
      res.json({ count: items.length, items });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/admin/physical-card-orders/:id", async (req, res, next) => {
    try {
      const adminUser = requireAdmin(req);
      const order = await physicalCardsService.updateOrderStatus(req.params.id, req.body);
      await adminService.logAdminAction(adminUser, {
        action: "physical_card_order_status_updated",
        targetType: "physical_card_order",
        targetId: order.id,
        targetLabel: order.recipientName,
        metadata: {
          status: order.status,
          statusLabel: order.status
        }
      });
      res.json(order);
    } catch (error) {
      next(error);
    }
  });

  router.get("/me/physical-card-orders", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const items = await physicalCardsService.listOwnOrders(user);
      res.json({ count: items.length, items });
    } catch (error) {
      next(error);
    }
  });

  router.post("/me/physical-card-orders", async (req, res, next) => {
    try {
      const user = requireUser(req);
      const order = await physicalCardsService.createOrder(user, req.body);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
