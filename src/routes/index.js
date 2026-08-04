import { Router } from 'express';
import { createUserModule } from '../modules/user/index.js';
import { createFournisseurModule } from '../modules/fournisseur/index.js';
import { createEquipementModule } from '../modules/equipement/index.js';

export function registerRoutes(apiRouter) {
  const modules = [
    createUserModule(),
    createFournisseurModule(),
    createEquipementModule(),
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
