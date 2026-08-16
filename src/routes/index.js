import { Router } from 'express';
import { createUserModule } from '../modules/user/index.js';
import { createFournisseurModule } from '../modules/fournisseur/index.js';
import { createEquipementModule } from '../modules/equipement/index.js';
import { createTypeEquipementModule } from '../modules/type_equipement/index.js';
import { createDashboardModule } from '../modules/dashboard/index.js';
import { createCommandeModule } from '../modules/commande/index.js';
import { createPanneModule } from '../modules/panne/index.js';

export function registerRoutes(apiRouter) {
  const modules = [
    createUserModule(),
    createFournisseurModule(),
    createEquipementModule(),
    createTypeEquipementModule(),
    createDashboardModule(),
    createCommandeModule(),
    createPanneModule(),
  ];

  for (const mod of modules) {
    apiRouter.use(mod.basePath, mod.routes);
  }

  return modules;
}

export function createHealthRouter() {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });
  return router;
}
