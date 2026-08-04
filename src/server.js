import config from './config/index.js';
import { createApp } from './app.js';
import { connectDatabase } from './infrastructure/database/connection.js';
import { seedAdmin } from './shared/seeds/seedAdmin.js';

const app = createApp();

try {
  await connectDatabase();
  await seedAdmin(); // Création automatique de l'admin si nécessaire
  
  app.listen(config.port, () => {
    if (!config.isProduction) {
      console.log(`[development] Server listening on http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`Swagger UI: http://localhost:${config.port}/docs`);
    }
  });
} catch (error) {
  console.error('[startup] Failed to connect to MongoDB:', error.message);
  process.exit(1);
}
