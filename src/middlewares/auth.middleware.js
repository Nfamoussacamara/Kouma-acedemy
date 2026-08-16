import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { UnauthorizedError } from '../shared/errors/AppError.js';
import { TokenBlacklistRepository } from '../modules/user/repositories/tokenBlacklist.repository.js';

/**
 * Vérifie le token JWT et attache l'utilisateur décodé à req.user.
 * Rejette immédiatement les tokens révoqués (blacklist).
 * Expects: Authorization: Bearer <token>
 */
export async function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Mauvais header d\'authentification'));
  }

  const token = header.slice(7);

  if (!token) {
    return next(new UnauthorizedError('Token requis'));
  }

  try {
 
    const isBlacklisted = await TokenBlacklistRepository.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next(new UnauthorizedError('Ce jeton a été révoqué suite à une déconnexion'));
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.token = token;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      type: decoded.type, // 'Admin' ou 'Utilisateur'
    };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    return next(new UnauthorizedError('Jeton d\'accès invalide ou expiré'));
  }
}

/**
 * Middleware facultatif : attache l'utilisateur si le token est valide et non révoqué.
 */
export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const isBlacklisted = await TokenBlacklistRepository.isTokenBlacklisted(token);
      if (!isBlacklisted) {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.token = token;
        req.user = {
          id: decoded.id,
          username: decoded.username,
          type: decoded.type,
        };
      }
    } catch (e) {
    
    }
  }
  next();
}

