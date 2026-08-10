import typeEquipementRepository from './repositories/typeEquiment.repository.js';
import { TypeEquipementService } from './services/typeEquipement.service.js';
import { TypeEquipementController } from './controllers/TypeEquiment.controller.js';
import { createTypeEquipementRoutes } from './routes/typeEquipement.route.js';

import { Router } from 'express';

/**
 * Composition root — module type-equipement.
 */
export function createTypeEquipementModule() {
  new TypeEquipementController();

  const mainRouter = Router();
  mainRouter.use('/type-equipements', createTypeEquipementRoutes());

  return {
    name: 'type-equipement',
    basePath: '/',
    routes: mainRouter,
    typeEquipementRepository: typeEquipementRepository,
    typeEquipementServices: {
      TypeEquipementService,
    }
  };
}
