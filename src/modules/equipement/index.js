import { EquipementController } from './controllers/equipement.controller.js';
import { createEquipementRoutes } from './routes/equipement.routes.js';
import { EquipementRepository } from './repositories/equipement.repository.js';
import { EquipementService } from './services/equipement.service.js';

/**
 * Composition root — module équipements.
 */
export function createEquipementModule() {
  new EquipementController();
  const routes = createEquipementRoutes();

  return {
    name: 'equipement',
    basePath: '/equipements',
    routes,
    equipementRepository: EquipementRepository,
    equipementService: EquipementService,
  };
}
