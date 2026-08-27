import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import config from '../../../config/index.js';
import { UnauthorizedError, NotFoundError } from '../../../shared/errors/AppError.js';
import { UserRepository } from '../repositories/user.repository.js';
import { TokenBlacklistRepository } from '../repositories/tokenBlacklist.repository.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class AuthService {
  static login = async ({ username, password }) => {
    const user = await UserRepository.getUserByUsernameWithPassword(username);
    if (!user) {
      throw new UnauthorizedError('Nom d\'utilisateur ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Ce compte a été désactivé par l\'administrateur');
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Nom d\'utilisateur ou mot de passe incorrect');
    }

    const accessPayload = {
      id: user._id.toString(),
      username: user.username,
      type: user.type,
    };

    const refreshPayload = {
      id: user._id.toString(),
      tokenVersion: user.tokenVersion ?? 0,
    };

    const accessToken = jwt.sign(accessPayload, config.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
    const refreshToken = jwt.sign(refreshPayload, config.jwtSecret, { expiresIn: REFRESH_TOKEN_TTL });

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
    if (!refreshToken) {
      throw new UnauthorizedError('Jeton de rafraîchissement manquant');
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwtSecret);
    } catch (error) {
      throw new UnauthorizedError('Jeton de rafraîchissement invalide ou expiré');
    }

    const user = await UserRepository.getUserById(decoded.id);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }
    if (!user.isActive) {
      throw new UnauthorizedError('Ce compte a été désactivé');
    }

    const isBlacklisted = await TokenBlacklistRepository.getTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      await UserRepository.incrementTokenVersion(user._id.toString());
      throw new UnauthorizedError('Session compromise détectée, veuillez vous reconnecter');
    }

    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedError('Session expirée, veuillez vous reconnecter');
    }
    await TokenBlacklistRepository.addToken({
      token: refreshToken,
      expiresAt: new Date(decoded.exp * 1000),
      userId: user._id.toString(),
      reason: 'rotation',
    });
    const accessPayload = {
      id: user._id.toString(),
      username: user.username,
      type: user.type,
    };
    const newRefreshPayload = {
      id: user._id.toString(),
      tokenVersion: user.tokenVersion ?? 0,
    };
    const accessToken = jwt.sign(accessPayload, config.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
    const newRefreshToken = jwt.sign(newRefreshPayload, config.jwtSecret, { expiresIn: REFRESH_TOKEN_TTL });
    return { accessToken, refreshToken: newRefreshToken };
  };

  static #revokeToken = async ({ token, userId, reason }) => {
    if (!token) return;
    const existingToken = await TokenBlacklistRepository.getTokenBlacklisted(token);
    if (existingToken) {
      return;
    }
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch {
      return;
    }
    await TokenBlacklistRepository.addToken({
      token,
      expiresAt: decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      userId,
      reason,
    });
  };
  
  static logout = async ({ token, accessToken, refreshToken, userId = null }) => {
    const access = accessToken || token;
    if (access) {
      await this.#revokeToken({ token: access, userId, reason: "logout" });
    }
    if (refreshToken) {
      await this.#revokeToken({ token: refreshToken, userId, reason: "logout" });
    }
    return { success: true };
  };

  static logoutAll = async ({ userId }) => {
    const user = await UserRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }
    await UserRepository.incrementTokenVersion(userId);
    return { success: true };
  };
}
