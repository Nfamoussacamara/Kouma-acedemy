import { TypeEquipementRepository } from './repositories/typeEquipement.repository.js';
import { TypeEquipementService } from './services/typeEquipement.service.js';
import { TypeEquipementController } from './controllers/typeEquipement.controller.js';
import { createTypeEquipementRoutes } from './routes/typeEquipement.routes.js';

import { Router } from 'express';

/**
 * Composition root — module utilisateurs.
 */
export function createTypeEquipementModule() {
  new TypeEquipementController();

  const mainRouter = Router();
  mainRouter.use('/type-equipements', createTypeEquipementRoutes());

  return {
    name: 'type-equipement',
    basePath: '/',
    routes: mainRouter,
    typeEquipementRepository: TypeEquipementRepository,
    typeEquipementServices: {
      TypeEquipementService,
    }
  };
}
