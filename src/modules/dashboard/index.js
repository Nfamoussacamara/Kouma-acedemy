import DashboardController from './controllers/dashboard.controller.js';
import { createDashboardRoutes } from './routes/dashboard.routes.js';
import DashboardRepository from './repositories/dashboard.repository.js';

/**
 * Composition root — module équipements.
 */
export function createDashboardModule() {
  const routes = createDashboardRoutes();

  return {
    name: 'dashboard',
    basePath: '/dashboard',
    routes,
    dashboardRepository: DashboardRepository,
  };
}
