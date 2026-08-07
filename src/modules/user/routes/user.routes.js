import { Router } from 'express';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';
import { requireRole, requireAdminOrOwner } from '../../../middlewares/role.middleware.js';
import { UserController } from '../controllers/user.controller.js';
import { paginationQuerySchema } from '../../../validators/common.validator.js';
import {
  updateUserSchema,
  changePasswordSchema,
  toggleStatusSchema,
} from '../validators/user.validator.js';
import { apiRateLimit } from '../../../middlewares/rate-limit.midleware.js';
import { auditlogmidleware } from '../../../middlewares/logger.midleware.js';





export function createUserRoutes() {

  const router = Router();
  router.use(authMiddleware)
 
  router.get('/', apiRateLimit, auditlogmidleware, requireRole(["Admin"]), validateQuery(paginationQuerySchema), UserController.list);

  router.get('/me', apiRateLimit, auditlogmidleware, UserController.getMe);


  router.patch('/me/password', apiRateLimit, auditlogmidleware, validateBody(changePasswordSchema), UserController.updateMePassword);

  router.get('/:id', apiRateLimit, auditlogmidleware,  requireRole(["Admin"]), UserController.getById);

  router.patch(
    '/:id',
    apiRateLimit,
    auditlogmidleware,
    requireAdminOrOwner(),
    validateBody(updateUserSchema),
    UserController.update
  );

  router.patch(
    '/:id/status',
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    validateBody(toggleStatusSchema),
    UserController.toggleStatus
  );

  router.delete(
    '/:id',
    apiRateLimit,
    auditlogmidleware,
    requireRole(["Admin"]),
    UserController.delete
  );

  return router;
}
