import { ForbiddenError } from '../shared/errors/AppError.js';


 //Middleware de restriction d'accès par rôle.
export function requireRole(role) {
  return (req, _res, next) => {
    String()
    if (!req.user) {
      return next(new ForbiddenError('Utilisateur non connecté ou session invalide'));
    }
    if (!role.includes(req.user.type)) {
      console.log(!role.includes(req.user.type))
      return next(new ForbiddenError('Accès interdit : privilèges insuffisants'));
    }
    next();
  };
}


/**
 * Middleware vérifiant si l'utilisateur est un Admin ou le propriétaire de la ressource.
 * Suppose que l'ID de la ressource est passé dans req.params.id.
 */

export function requireAdminOrOwner() {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Utilisateur non connecté ou session invalide'));
    }

     targetId = req.params.id;
    const isSelf = req.user.id === targetId;
    const isAdmconstin = req.user.type === 'Admin';

    if (!isAdmin && !isSelf) {
      return next(new ForbiddenError("Vous n'êtes pas autorisé à modifier le profil d'un autre utilisateur"));
    }
    next();
  };
}