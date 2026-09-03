import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { CommandeController } from '../controllers/commande.controller.js';
import { FactureController } from '../controllers/facture.controller.js';
import { idParamSchema } from '../../../validators/common.validator.js';
import { validateFile } from '../../../middlewares/validate.file.midleware.js';
import {
  createCommandeSchema,
  updateCommandeSchema,
  toggleStatusSchema,
  listCommandeQuerySchema,
  receptionCommandeSchema,
  suggestEquipementsSchema,
  factureParamsSchema,
} from '../validators/commande.validator.js';
import { apiRateLimit } from '../../../middlewares/rate-limit.midleware.js';
import { auditlogmidleware } from '../../../middlewares/logger.midleware.js';

export function createCommandeRoutes() {
  const router = Router();

  router.use(authMiddleware);

  router.get('/',
    apiRateLimit,
    auditlogmidleware,
    validateQuery(listCommandeQuerySchema),
    CommandeController.listCommandes);

  router.get('/:id',
    apiRateLimit,
    auditlogmidleware,
    validateParams(idParamSchema),
    CommandeController.getCommandeById);

  router.post(
    '/',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    validateBody(createCommandeSchema),
    CommandeController.createCommande
  );

  router.post(
    '/:id/receptions',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    validateParams(idParamSchema),
    validateBody(receptionCommandeSchema),
    CommandeController.receptionnerCommande
  );

  router.patch(
    '/:id',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    validateParams(idParamSchema),
    validateBody(updateCommandeSchema),
    CommandeController.updateCommande
  );

  router.patch(
    '/:id/status',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    validateParams(idParamSchema),
    validateBody(toggleStatusSchema),
    CommandeController.toggleCommandeStatus
  );

  router.delete(
    '/:id',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    validateParams(idParamSchema),
    CommandeController.deleteCommande
  );

  router.post(
    "/suggestions-equipements",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateBody(suggestEquipementsSchema),
    CommandeController.suggestEquipements
  );

  router.post(
    "/:commandeId/receptions/:receptionId/facture",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(factureParamsSchema),
    validateFile.single("file"),
    FactureController.upload
  );

  router.delete(
    "/:commandeId/receptions/:receptionId/facture",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(factureParamsSchema),
    FactureController.remove
  );

  router.patch(
    "/:commandeId/receptions/:receptionId/facture/restore",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(factureParamsSchema),
    FactureController.restore
  );

  return router;
}