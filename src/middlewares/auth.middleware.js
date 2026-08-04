import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { UnauthorizedError } from '../shared/errors/AppError.js';

/**
 * Vérifie le token JWT et attache l'utilisateur décodé à req.user.
 * Expects: Authorization: Bearer <token>
 */
export function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Mauvais header d\'authentification'));
  }

  const token = header.slice(7);

  if (!token) {
    return next(new UnauthorizedError('Token requis'));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      type: decoded.type, // 'Admin' ou 'Utilisateur'
    };
    next();
  } catch (error) {
    return next(new UnauthorizedError('Jeton d\'accès invalide ou expiré'));
  }
}

/**
 * Middleware facultatif : attache l'utilisateur si le token est valide, sinon continue sans erreur.
 */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = {
        id: decoded.id,
        username: decoded.username,
        type: decoded.type,
      };
    } catch (e) {
      // Échec silencieux car l'auth est optionnelle
    }
  }
  next();
}
