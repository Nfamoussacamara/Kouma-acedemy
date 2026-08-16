import { Router } from "express";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { requireRole } from "../../../middlewares/role.middleware.js";
import { PanneController } from "../controllers/panne.controller.js";
import { idParamSchema } from "../../../validators/common.validator.js";
import { apiRateLimit } from "../../../middlewares/rate-limit.midleware.js";
import { auditlogmidleware } from "../../../middlewares/logger.midleware.js";
import {
  createPanneSchema,
  updatePanneSchema,
  listPanneQuerySchema,
  toggleStatutSchema,
} from "../validators/panne.validator.js";

export function createPanneRoutes() {
  const router = Router();

  router.use(authMiddleware);

  // Endpoint pour charger les options dynamiques du formulaire (UI)
  router.get(
    "/options",
    apiRateLimit,
    PanneController.getOptions
  );

  router.get(
    "/",
    apiRateLimit,
    auditlogmidleware,
    validateQuery(listPanneQuerySchema),
    PanneController.listPannes
  );

  router.get(
    "/:id",
    apiRateLimit,
    auditlogmidleware,
    validateParams(idParamSchema),
    PanneController.getPanneById
  );

  router.post(
    "/",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateBody(createPanneSchema),
    PanneController.createPanne
  );

  router.patch(
    "/:id",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(idParamSchema),
    validateBody(updatePanneSchema),
    PanneController.updatePanne
  );

  router.patch(
    "/:id/statut",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(idParamSchema),
    validateBody(toggleStatutSchema),
    PanneController.toggleStatut
  );

  router.delete(
    "/:id",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(idParamSchema),
    PanneController.deletePanne
  );

  return router;
}
