import multer from "multer";
// import { AppError } from "../shared/errors/AppError.js";
// import config from "../config/index.js"

export function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route non trouvée" },
  });
}

export function errorHandler(err, _req, res, _next) {
  // const isAppError = err instanceof AppError;
  // const statusCode = isAppError ? err.statusCode : 500;
  // const code = isAppError ? err.code : 'INTERNAL_ERROR';
  // const message = isAppError ? err.message : 'Erreur interne du serveur';

  // if (!isAppError && !config.isProduction) {
  //   console.error(err);
  // }

  // const payload = {
  //   success: false,
  //   error: { code, message },
  // };

  // if (err.details?.length) {
  //   payload.error.details = err.details;
  // }

  // if (!config.isProduction && !isAppError && err.stack) {
  //   payload.error.stack = err.stack;
  // }

  // res.status(statusCode).json(payload);


  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Le fichier ne doit pas dépasser 5 Mo",
        error: "FILE_TOO_LARGE",
        statusCode: 400,
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: 'Nom de champ de fichier invalide (attendu : "file")',
        error: "UNEXPECTED_FILE",
        statusCode: 400,
      });
    }

    return res.status(400).json({
      message: err.message,
      error: err.code,
      statusCode: 400,
    });
  }

  if (err?.isOperational) {
    const payload = {
      message: err.message,
      error: err.code,
      statusCode: err.statusCode,
    };
    if (err.details?.length) {
      payload.details = err.details;
    }
    return res.status(err.statusCode).json(payload);
  }

  return res.status(500).json({
    message: err?.message || "Erreur interne du serveur",
    error: err?.code || "INTERNAL_ERROR",
    statusCode: 500,
  });
}
