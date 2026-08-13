import { Router } from 'express';
import DashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';
import { requireRole } from '../../../middlewares/role.middleware.js';
import { apiRateLimit } from '../../../middlewares/rate-limit.midleware.js';

export function createDashboardRoutes() {
    const router = Router();
    router.get('/',
        apiRateLimit,
        authMiddleware,
        requireRole(['Admin', 'User']),
        DashboardController.getDashboardStats
    );
    return router;
}