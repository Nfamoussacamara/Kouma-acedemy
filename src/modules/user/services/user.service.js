import argon2 from "argon2";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../shared/errors/AppError.js';
import { isValidObjectId } from '../../../infrastructure/database/mongoose.js';
import { UserRepository } from '../repositories/user.repository.js';
import { getPagination } from '../../../shared/utils/pagination.util.js';
import { createSearchFilter } from '../../../shared/utils/search.util.js';
import { formatPhoneNumber } from '../../../shared/utils/phone.util.js';
import { removeUndefinedValues } from '../../../shared/utils/payload.util.js';

const isDuplicateKeyError = (error) => error?.code === 11000;

export class UserService {
  static listUsers = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const searchFilter = createSearchFilter(query.search, ['nom', 'prenom', 'username', 'tel']);
    
    const filter = { ...searchFilter };

    if (query.status === "active") {
      filter.isActive = true;
    } else if (query.status === "inactive") {
      filter.isActive = false;
    }

    filter.deletedAt = null;

    const [documents, total] = await UserRepository.findAll({
      skip,
      limit,
      filter,
    });
 
    return {
      data: documents,
      meta: { page, limit, total },
    };
  };

  static getUserById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant utilisateur invalide");
    }
    const user = await UserRepository.getUserById(id);
    if (!user) {
      throw new NotFoundError(`Utilisateur ${id} non trouvé`);
    }
    return user;
  };

  static createUser = async (dto) => {

    const user = await UserRepository.getUserByUsername(dto.username);
    if (user) {
      throw new ConflictError("Ce nom d'utilisateur est déjà utilisé");
    }

    const phone = formatPhoneNumber(dto.tel);
    const existingUser = await UserRepository.findUserByPhone(phone);
    if (existingUser) {
      throw new ConflictError("Ce numéro de téléphone est déjà utilisé");
    }

    try {
      const hashedPassword = await argon2.hash(dto.password);
      return await UserRepository.createUser({
        username: dto.username,
        password: hashedPassword,
        nom: dto.nom,
        prenom: dto.prenom,
        tel: phone,
        type: dto.type,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("Ce nom d'utilisateur est déjà utilisé");
      }
      throw error;
    }
  };

  static updateUser = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant utilisateur invalide");
    }
    
    if (dto.tel) {
      const phone = formatPhoneNumber(dto.tel);
      const existingUser = await UserRepository.findUserByPhone(phone);
      if (existingUser && existingUser._id.toString() !== id) {
        throw new ConflictError("Ce numéro de téléphone est déjà utilisé par un autre compte !");
      }
    }

    try {
      const payload = removeUndefinedValues({
        username: dto.username,
        password: dto.password,
        nom: dto.nom,
        prenom: dto.prenom,
        tel: dto.tel ? formatPhoneNumber(dto.tel) : undefined,
        type: dto.type,
        isActive: dto.isActive,
      });

      if (Object.keys(payload).length === 0) {
        return UserService.getUserById(id);
      }

      if (payload.password) {
        payload.password = await argon2.hash(payload.password);
      }

      const updated = await UserRepository.updateUser(id, payload);
      if (!updated) {
        throw new NotFoundError(`Utilisateur ${id} non trouvé`);
      }
      return updated;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("Ce nom d'utilisateur est déjà utilisé");
      }
      throw error;
    }
  };

  static changePassword = async (id, { oldPassword, newPassword }) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant utilisateur invalide");
    }
    const user = await UserRepository.getUserByIdWithPassword(id);
    if (!user) {
      throw new NotFoundError(`Utilisateur ${id} non trouvé`);
    }

    const isValid = await argon2.verify(user.password, oldPassword);
    if (!isValid) {
      throw new UnauthorizedError("L'ancien mot de passe est incorrect");
    }

    const hashedPassword = await argon2.hash(newPassword);
    const updated = await UserRepository.updateUser(id, {
      password: hashedPassword,
    });
    return updated;
  };

  static toggleUserStatus = async (id, { isActive }) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant utilisateur invalide");
    }
    const updated = await UserRepository.updateUser(id, { isActive });
    if (!updated) {
      throw new NotFoundError(`Utilisateur ${id} non trouvé`);
    }
    return updated;
  };

  static deleteUser = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant utilisateur invalide");
    }
    const deleted = await UserRepository.deleteLogically(id);
    if (!deleted) {
      throw new NotFoundError(`Utilisateur ${id} non trouvé`);
    }
  };
}
