import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import config from './config/index.js';
import { createCorsMiddleware } from './middlewares/cors.middleware.js';
import { createLoggingMiddleware } from './middlewares/logging.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { registerRoutes, createHealthRouter } from './routes/index.js';
import { openApiSpec } from '../docs/swagger/openapi.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.set("trust proxy", 1);
  app.disable("x-powered-by")
  app.use(createCorsMiddleware());
  app.use(createLoggingMiddleware());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(createHealthRouter());

  if (!config.isProduction) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  const apiRouter = express.Router();
  registerRoutes(apiRouter);
  app.use(config.apiPrefix, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
