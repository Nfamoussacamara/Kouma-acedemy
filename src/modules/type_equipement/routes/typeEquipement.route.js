import { Router } from "express";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { requireRole } from "../../../middlewares/role.middleware.js";
import { TypeEquipementController } from "../controllers/TypeEquiment.controller.js";
import {
  updateTypeEquipementSchema,
  createTypeEquipementSchema,
  deleteTypeEquipementSchema,
  getTypeEquipementByIdSchema,
  listTypeEquipementsSchema,
  toggleStatusSchema,
} from "../validators/typeEquipement.validator.js";
import { apiRateLimit } from "../../../middlewares/rate-limit.midleware.js";
import { auditlogmidleware } from "../../../middlewares/logger.midleware.js";

export function createTypeEquipementRoutes() {
  const router = Router();
  router.use(authMiddleware);

  router.get(
    "/",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateQuery(listTypeEquipementsSchema),
    TypeEquipementController.listTypeEquipements,
  );

  router.get(
    "/:id",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(getTypeEquipementByIdSchema),
    TypeEquipementController.getTypeEquipementById,
  );

  router.post(
    "/",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateBody(createTypeEquipementSchema),
    TypeEquipementController.createTypeEquipement,
  );

  router.patch(
    "/:id",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateBody(updateTypeEquipementSchema),
    TypeEquipementController.updateTypeEquipement,
  );

  router.patch(
    "/:id/status",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateBody(toggleStatusSchema),
    TypeEquipementController.toggleStatus,
  );

  router.delete(
    "/:id",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(deleteTypeEquipementSchema),
    TypeEquipementController.deleteTypeEquipement,
  );

  return router;
}
