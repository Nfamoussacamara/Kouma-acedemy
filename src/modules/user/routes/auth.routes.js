import { Router } from 'express';
import { validateBody } from '../../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';
import { requireRole} from '../../../middlewares/role.middleware.js';
import { AuthController } from '../controllers/auth.controller.js';
import { loginSchema, registerSchema, refreshSchema } from '../validators/auth.validator.js';
import { loginRateLimit, apiRateLimit } from '../../../middlewares/rate-limit.midleware.js';
import { auditlogmidleware } from '../../../middlewares/logger.midleware.js';

export function createAuthRoutes() {
  const router = Router()

  router.post('/login', loginRateLimit, auditlogmidleware, validateBody(loginSchema), AuthController.login);

  router.post('/refresh', apiRateLimit, auditlogmidleware, validateBody(refreshSchema), AuthController.refresh);

  router.post(
    '/register',
    apiRateLimit,
    auditlogmidleware,
    authMiddleware,
    requireRole(['Admin']),
    validateBody(registerSchema),
    AuthController.register
  );

  router.post(
    '/logout',
    apiRateLimit,
    auditlogmidleware,
    authMiddleware,
    AuthController.logout
  );

  return router;
}
