import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import config from '../../../config/index.js';
import { UnauthorizedError } from '../../../shared/errors/AppError.js';
import { UserRepository } from '../repositories/user.repository.js';

import { TokenBlacklistRepository } from '../repositories/tokenBlacklist.repository.js';

export class AuthService {
  static login = async ({ username, password }) => {
    // 1. Trouver l'utilisateur avec son password (nécessite le select: false du password)
    const user = await UserRepository.getUserByUsernameWithPassword(username);
    if (!user) {
      throw new UnauthorizedError('Nom d\'utilisateur ou mot de passe incorrect');
    }

    // 2. Vérifier si le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedError('Ce compte a été désactivé par l\'administrateur');
    }

    // 3. Valider le mot de passe via argon2
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Nom d\'utilisateur ou mot de passe incorrect');
    }

    // 4. Générer des tokens JWT
    const payload = {
      id: user._id.toString(),
      username: user.username,
      type: user.type,  // Admin ou Utilisateur
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id.toString() }, config.jwtSecret, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        nom: user.nom,
        prenom: user.prenom,
        tel: user.tel,
        type: user.type,
      },
    };
  };

  static refresh = async ({ refreshToken }) => {
    try {
      // Vérifier la validité du refresh token
      const decoded = jwt.verify(refreshToken, config.jwtSecret);

      const user = await UserRepository.getUserById(decoded.id);
      if (!user) {
        throw new UnauthorizedError('Utilisateur non trouvé');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Ce compte a été désactivé');
      }

      // Re-générer un nouvel access token
      const payload = {
        id: user.id,
        username: user.username,
        type: user.type,
      };

      const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedError('Jeton de rafraîchissement invalide ou expiré');
    }
  };

  static logout = async ({ token, userId = null }) => {
    if (token) {
      try {
        // Décode le token pour récupérer la date d'expiration exacte (exp en secondes)
        const decoded = jwt.decode(token);
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 15 * 60 * 1000); // Fallback: 15 min

        await TokenBlacklistRepository.addToken({
          token,
          expiresAt,
          userId,
          reason: "logout",
        });
      } catch (err) {
        // En cas d'erreur de décodage, enregistre avec une expiration par défaut
        await TokenBlacklistRepository.addToken({
          token,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          userId,
          reason: "logout",
        });
      }
    }
    return { success: true };
  };
}

