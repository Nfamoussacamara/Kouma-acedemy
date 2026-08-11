import {
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/AppError.js";
import { isValidObjectId } from "../../../infrastructure/database/mongoose.js";
import { getPagination } from "../../../shared/utils/pagination.util.js";
import { createSearchFilter } from "../../../shared/utils/search.util.js";
import { removeUndefinedValues } from "../../../shared/utils/payload.util.js";
import typeEquipementRepository from "../repositories/typeEquiment.repository.js";

export class TypeEquipementService {
  static listTypeEquipements = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const searchFilter = createSearchFilter(query.search, [
      "name",
      "description",
    ]);
    const filter = {
      ...searchFilter,
    };

    if (query.status === "active") {
      filter.isActive = true;
    } else if (query.status === "inactive") {
      filter.isActive = false;
    }

    filter.deletedAt = null;

    const [documents, total] = await typeEquipementRepository.getAllTypeEquipements({
      skip,
      limit,
      filter,
    });

    return {
      data: documents,
      meta: { page, limit, total },
    };
  };

  static getTypeEquipementById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant du type d'équipement invalide");
    }
    const equipement = await typeEquipementRepository.getTypeEquipementById(id);
    if (!equipement) {
      throw new NotFoundError(`Type d'équipement ${id} non trouvé`);
    }
    return equipement;
  };

  static createTypeEquipement = async (dto) => {
    const equipement = await typeEquipementRepository.createTypeEquipement(dto);
    return equipement;
  };

  static updateTypeEquipement = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant équipement invalide");
    }
    const existing = await typeEquipementRepository.getTypeEquipementById(id);
    if (!existing) {
      throw new NotFoundError(`Type d'équipement ${id} non trouvé`);
    }

    const payload = removeUndefinedValues({
      name: dto.name,
      description: dto.description,
    });

    if (Object.keys(payload).length === 0) {
      return existing;
    }

    const updated = await typeEquipementRepository.updateTypeEquipement(id, payload);
    return updated;
  };

  static deleteTypeEquipement = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant du type d'équipement invalide");
    }

    const typeEquipement = await typeEquipementRepository.getTypeEquipementById(id);

    if (typeEquipement) {
      const equipementCount = await typeEquipementRepository.getTypeEquipementById(id);
      if (equipementCount > 0) {
        throw new ConflictError(
          `Impossible de supprimer ce type d'équipement car il est déjà lié à ${equipementCount} équipements`,
        );
      }
    }
    if (!typeEquipement) {
      throw new NotFoundError(`Type d'équipement ${id} non trouvé`);
    }

    const success = await typeEquipementRepository.deleteLogically(id);
    if (!success) {
      throw new NotFoundError(
        `Type d'équipement ${id} non trouvé ou déjà supprimé`,
      );
    }

  };

    static toggleTypeEquipementStatus = async (id, { isActive }) => {
      if (!isValidObjectId(id)) {
        throw new ValidationError("Identifiant du type d'équipement invalide");
      }
      const updated = await typeEquipementRepository.updateStatus(id, { isActive });
      if (!updated) {
        throw new NotFoundError(`Type d'équipement ${id} non trouvé`);
      }
      return updated;
    };



}
