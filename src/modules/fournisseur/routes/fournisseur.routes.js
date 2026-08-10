import { Router } from 'express';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { FournisseurController } from '../controllers/fournisseur.controller.js';
import { paginationQuerySchema } from '../../../validators/common.validator.js';
import { createFournisseurSchema, updateFournisseurSchema, toggleStatusSchema } from '../validators/fournisseur.validator.js';
import { apiRateLimit } from '../../../middlewares/rate-limit.midleware.js';
import { auditlogmidleware } from '../../../middlewares/logger.midleware.js';


export function createFournisseurRoutes() {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', apiRateLimit, auditlogmidleware, validateQuery(paginationQuerySchema), FournisseurController.list);

  router.get('/:id', apiRateLimit, auditlogmidleware, FournisseurController.getById);

  router.post('/' , apiRateLimit, auditlogmidleware, requireRole(['Admin']), validateBody(createFournisseurSchema), FournisseurController.create);

  router.patch(
    '/:id',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    validateBody(updateFournisseurSchema),
    FournisseurController.update
  );

  router.patch(
    '/:id/status',
    apiRateLimit,
    auditlogmidleware,
    requireRole(['Admin']),
    validateBody(toggleStatusSchema),
    FournisseurController.toggleStatus
  );

  router.delete('/:id', apiRateLimit, requireRole(['Admin']), FournisseurController.delete);

  return router;
}
