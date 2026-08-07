import {
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/AppError.js";
import { typeEquipementRepository } from "../repositories/typeEquipement.repository.js";
import { isValidObjectId } from "../../../infrastructure/database/mongoose.js";
import { getPagination } from "../../../shared/utils/pagination.util.js";
import { createSearchFilter } from "../../../shared/utils/search.util.js";

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

    const [documents, total] = await typeEquipementRepository.findAll({
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
    const equipement = await typeEquipementRepository.findById(id);
    if (!equipement) {
      throw new NotFoundError(`Type d'équipement ${id} non trouvé`);
    }
    return equipement;
  };

  static createTypeEquipement = async (dto) => {
    const equipement = await typeEquipementRepository.create(dto);
    return equipement;
  };

  static updateTypeEquipement = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant équipement invalide");
    }
    const existing = await typeEquipementRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Type d'équipement ${id} non trouvé`);
    }

    const updated = await typeEquipementRepository.update(id, dto);
    return updated;
  };

  static deleteTypeEquipement = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant du type d'équipement invalide");
    }

    const typeEquipement = await typeEquipementRepository.findById(id);

    if (typeEquipement) {
      const equipementCount = await equipementRepository.countByTypeId(id);
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
      const updated = await typeEquipementRepository.update(id, { isActive });
      if (!updated) {
        throw new NotFoundError(`Type d'équipement ${id} non trouvé`);
      }
      return updated;
    };



}
