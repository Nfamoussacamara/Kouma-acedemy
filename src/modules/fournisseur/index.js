import { FournisseurController } from './controllers/fournisseur.controller.js';
import { createFournisseurRoutes } from './routes/fournisseur.routes.js';

/**
 * Composition root — module fournisseurs.
 */
export function createFournisseurModule() {
  new FournisseurController();
  const routes = createFournisseurRoutes();

  return {
    name: 'fournisseur',
    basePath: '/fournisseurs',
    routes,
  };
}
