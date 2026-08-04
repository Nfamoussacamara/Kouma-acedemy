import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import config from '../../../config/index.js';
import { UnauthorizedError } from '../../../shared/errors/AppError.js';
import { UserRepository } from '../repositories/user.repository.js';

export class AuthService {
  static login = async ({ username, password }) => {
    // 1. Trouver l'utilisateur avec son password (nécessite le select: false du password)
    const user = await UserRepository.findByUsernameWithPassword(username);
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

      const user = await UserRepository.findById(decoded.id);
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
}
