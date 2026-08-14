import { CommandeController } from './controllers/commande.controller.js';
import { createCommandeRoutes } from './routes/commande.routes.js';
import { CommandeRepository } from './repositories/commande.repository.js';
import { CommandeService } from './services/commande.service.js';

/**
 * Composition root — module commande.
 */
export function createCommandeModule() {
  new CommandeController();
  const routes = createCommandeRoutes();

  return {
    name: 'commande',
    basePath: '/commandes',
    routes,
    commandeRepository: CommandeRepository,
    commandeService: CommandeService,
  };
}