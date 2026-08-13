import { UserRepository } from './repositories/user.repository.js';
import { UserService } from './services/user.service.js';
import { AuthService } from './services/auth.service.js';
import { UserController } from './controllers/user.controller.js';
import { AuthController } from './controllers/auth.controller.js';
import { createUserRoutes } from './routes/user.routes.js';
import { createAuthRoutes } from './routes/auth.routes.js';


import { Router } from 'express';

/**
 * Composition root — module utilisateurs.
 */
export function createUserModule() {
  new UserController();
  new AuthController();

  const mainRouter = Router();
  mainRouter.use('/users', createUserRoutes());
  mainRouter.use('/auth', createAuthRoutes());

  return {
    name: 'user',
    basePath: '/',
    routes: mainRouter,
    userRepository: UserRepository,
    userServices: {
      UserService,
      authService: AuthService,
    }
  };
}
