import argon2 from 'argon2';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/AppError.js';
import { isValidObjectId } from '../../../infrastructure/database/mongoose.js';
import { UserRepository } from '../repositories/user.repository.js';

const isDuplicateKeyError = (error) => error?.code === 11000;

export class UserService {
  static listUsers = async (query = {}) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    
    const skip = (page - 1) * limit;

    const [documents, total] = await UserRepository.findAll({ skip, limit });

    return {
      data: documents,
      meta: { page, limit, total },
    };
  };

  static getUserById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new Error("Identifiant utilisateur invalide");
    }
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`Utilisateur ${id} non trouvé`);
    }
    return user;
  };

  static createUser = async (dto) => {
    try {
      const hashedPassword = await argon2.hash(dto.password);
      return await UserRepository.create({
        username: dto.username,
        password: hashedPassword,
        nom: dto.nom,
        prenom: dto.prenom,
        tel: dto.tel,
        type: dto.type,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError('Ce nom d\'utilisateur est déjà utilisé');
      }
      throw error;
    }
  };

  static updateUser = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new Error("Identifiant utilisateur invalide");
    }
    try {
      const payload = Object.fromEntries(
        Object.entries({
          username: dto.username,
          password: dto.password,
          nom: dto.nom,
          prenom: dto.prenom,
          tel: dto.tel,
          type: dto.type,
          isActive: dto.isActive,
        }).filter(([, value]) => value !== undefined)
      );

      if (Object.keys(payload).length === 0) {
        return UserService.getUserById(id);
      }

      if (payload.password) {
        payload.password = await argon2.hash(payload.password);
      }

      const updated = await UserRepository.update(id, payload);
      if (!updated) {
        throw new NotFoundError(`Utilisateur ${id} non trouvé`);
      }
      return updated;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError('Ce nom d\'utilisateur est déjà utilisé');
      }
      throw error;
    }
  };

  static changePassword = async (id, { oldPassword, newPassword }) => {
    if (!isValidObjectId(id)) {
      throw new Error("Identifiant utilisateur invalide");
    }
    const user = await UserRepository.findByIdWithPassword(id);
    if (!user) {
      throw new NotFoundError(`Utilisateur ${id} non trouvé`);
    }

    const isValid = await argon2.verify(user.password, oldPassword);
    if (!isValid) {
      throw new UnauthorizedError('L\'ancien mot de passe est incorrect');
    }

    const hashedPassword = await argon2.hash(newPassword);
    const updated = await UserRepository.update(id, { password: hashedPassword });
    return updated;
  };

  static toggleUserStatus = async (id, { isActive }) => {
    if (!isValidObjectId(id)) {
      throw new Error("Identifiant utilisateur invalide");
    }
    const updated = await UserRepository.update(id, { isActive });
    if (!updated) {
      throw new NotFoundError(`Utilisateur ${id} non trouvé`);
    }
    return updated;
  };

  static deleteUser = async (id) => {
    if (!isValidObjectId(id)) {
      throw new Error("Identifiant utilisateur invalide");
    }
    const deleted = await UserRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Utilisateur ${id} non trouvé`);
    }
  };
}