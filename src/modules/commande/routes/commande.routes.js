import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { CommandeController } from '../controllers/commande.controller.js';
import { DocumentController } from '../controllers/document.controller.js';
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
    requireRole(['Admin', 'Utilisateur']),
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
    requireRole(['Admin', 'Utilisateur']),
    validateParams(idParamSchema),
    CommandeController.getCommandeById);

  router.post(
    '/',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin', 'Utilisateur']),
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
    "/:id/bon-signe",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin", "Utilisateur"]),
    validateParams(idParamSchema),
    validateFile.single('file'),
    DocumentController.uploadBonSigne
  );

  router.delete(
    "/:id/bon-signe",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin", "Utilisateur"]),
    validateParams(idParamSchema),
    DocumentController.deleteBonSigne
  );

  router.post(
    "/:id/bon-reception-signe",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin", "Utilisateur"]),
    validateParams(idParamSchema),
    validateFile.single('file'),
    DocumentController.uploadBonReceptionSigne
  );

  router.delete(
    "/:id/bon-reception-signe",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin", "Utilisateur"]),
    validateParams(idParamSchema),
    DocumentController.deleteBonReceptionSigne
  );


  router.post(
    "/:commandeId/receptions/:receptionId/facture",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(factureParamsSchema),
    validateFile.single("file"),
    DocumentController.uploadFacture
  );

  router.delete(
    "/:commandeId/receptions/:receptionId/facture",
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(factureParamsSchema),
    DocumentController.removeFacture
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