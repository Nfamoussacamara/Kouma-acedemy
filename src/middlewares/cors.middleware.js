import cors from 'cors';
import config from '../config/index.js';

export function createCorsMiddleware() {
  const origin =
    config.corsOrigin === '*'
      ? true
      : config.corsOrigin.split(',').map((o) => o.trim());

  return cors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
