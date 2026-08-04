import morgan from 'morgan';
import config from '../config/index.js';

export function createLoggingMiddleware() {
  if (config.isProduction) {
    return morgan('combined');
  }
  return morgan('dev');
}
