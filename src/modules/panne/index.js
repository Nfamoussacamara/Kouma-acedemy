import { PanneController } from "./controllers/panne.controller.js";
import { createPanneRoutes } from "./routes/panne.routes.js";
import { PanneRepository } from "./repositories/panne.repository.js";
import { PanneService } from "./services/panne.service.js";

/**
 * Composition root — module panne.
 */
export function createPanneModule() {
  new PanneController();
  const routes = createPanneRoutes();

  return {
    name: "panne",
    basePath: "/pannes",
    routes,
    panneRepository: PanneRepository,
    panneService: PanneService,
  };
}
