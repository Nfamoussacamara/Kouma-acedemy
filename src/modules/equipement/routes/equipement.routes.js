import { Router } from 'express';
import { validateQuery, validateParams, validateBody } from '../../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { EquipementController } from '../controllers/equipement.controller.js';
import { idParamSchema } from '../../../validators/common.validator.js';
import {
  createEquipementSchema,
  updateEquipementSchema,
  listEquipementsQuerySchema,
  toggleStatusSchema,
} from '../validators/equipement.validator.js';
import { apiRateLimit } from '../../../middlewares/rate-limit.midleware.js';
import { auditlogmidleware } from '../../../middlewares/logger.midleware.js';

export function createEquipementRoutes() {
  
  const router = Router();
  router.use(authMiddleware);


  router.get('/', 
    apiRateLimit, 
    auditlogmidleware, 
    validateQuery(listEquipementsQuerySchema), 
    EquipementController.list);


  router.get('/:id' , 
    apiRateLimit, 
    auditlogmidleware, 
    validateParams(idParamSchema), 
    EquipementController.getById);


  router.post('/' , 
    apiRateLimit, 
    auditlogmidleware, 
    requireRole(["Admin"]), 
    validateBody(createEquipementSchema), 
    EquipementController.create );

 
  router.patch(
    '/:id',
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(idParamSchema),
    validateBody(updateEquipementSchema),
    EquipementController.update
  );

    router.patch(
      '/:id/status',
      apiRateLimit,
      auditlogmidleware,
      requireRole(["Admin"]),
      validateBody(toggleStatusSchema),
      EquipementController.toggleStatus
    );

  router.delete('/:id',
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateParams(idParamSchema),
    EquipementController.delete);

  return router;
}
