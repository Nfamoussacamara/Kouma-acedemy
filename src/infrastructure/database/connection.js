import config from '../../config/index.js';
import { mongoose } from './mongoose.js';

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(config.mongodbUri);
  console.log(`[mongoose] Connecté à ${mongoose.connection.name}`);
  return mongoose.connection;
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
  console.log('[mongoose] Déconnecté');
};
