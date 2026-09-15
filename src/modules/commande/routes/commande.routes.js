import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { CommandeController } from '../controllers/commande.controller.js';
import { FactureController } from '../controllers/facture.controller.js';
import { PaiementController } from '../controllers/paiement.controller.js';
import { idParamSchema } from '../../../validators/common.validator.js';
import { validateFile } from '../../../middlewares/validate.file.midleware.js';
import {
  createCommandeSchema,
  updateCommandeSchema,
  toggleStatusSchema,
  listCommandeQuerySchema,
  receptionCommandeSchema,
  factureParamsSchema,
  commandeIdParamSchema,
  paiementParamsSchema,
  createPaiementSchema,
  updatePaiementSchema,
} from '../validators/commande.validator.js';
import { apiRateLimit } from '../../../middlewares/rate-limit.midleware.js';
import { auditlogmidleware } from '../../../middlewares/logger.midleware.js';

export function createCommandeRoutes() {
  const router = Router();

  router.use(authMiddleware);

  router.get('/',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    validateQuery(listCommandeQuerySchema),
    CommandeController.listCommandes);

  router.get('/stats',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    CommandeController.getStats);

  router.get('/:id',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
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

  router.get(
    "/:commandeId/paiements/:paiementId",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(paiementParamsSchema),
    PaiementController.getPaiementById
  );

  router.post(
    "/:commandeId/paiements",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(commandeIdParamSchema),
    validateBody(createPaiementSchema),
    PaiementController.createPaiement
  );

  router.patch(
    "/:commandeId/paiements/:paiementId",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(paiementParamsSchema),
    validateBody(updatePaiementSchema),
    PaiementController.updatePaiement
  );

  router.delete(
    "/:commandeId/paiements/:paiementId",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(paiementParamsSchema),
    PaiementController.deletePaiement
  );

  return router;
}