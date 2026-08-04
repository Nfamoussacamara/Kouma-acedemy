import { AppError } from '../shared/errors/AppError.js';
import config from '../config/index.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route non trouvée' },
  });
}

export function errorHandler(err, _req, res, _next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_ERROR';
  const message = isAppError ? err.message : 'Erreur interne du serveur';

  if (!isAppError && !config.isProduction) {
    console.error(err);
  }

  const payload = {
    success: false,
    error: { code, message },
  };

  if (err.details?.length) {
    payload.error.details = err.details;
  }

  if (!config.isProduction && !isAppError && err.stack) {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}
