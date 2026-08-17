import {
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/AppError.js";
import { isValidObjectId } from "../../../infrastructure/database/mongoose.js";
import { getPagination } from "../../../shared/utils/pagination.util.js";
import { PanneRepository } from "../repositories/panne.repository.js";
import { CommandeModel } from "../../commande/infrastructure/persistence/models/Commande.model.js";
import {
  URGENCE_ORDER,
  STATUTS_PANNE,
  VALID_QUERY_STATUTS,
  STATUS_MAP,
  TYPE_PANNE,
  NIVEAU_URGENCE,
  SYSTEMES,
  IMPACTS_PAR_TYPE,
  TENTATIVES_PAR_TYPE,
} from "../panne.constants.js";

import { EquipementRepository } from "../../equipement/repositories/equipement.repository.js";

export class PanneService {
  // Helper pour vérifier l'existence des équipements en base
  static validateEquipementsExist = async (equipements = []) => {
    if (!Array.isArray(equipements) || equipements.length === 0) return;

    const catalogIds = equipements
      .filter((e) => e.equipement)
      .map((e) => e.equipement.toString());

    if (catalogIds.length > 0) {
      const foundEquipements = await EquipementRepository.getEquipementsByIds(catalogIds);
      const foundIdsMap = new Set(foundEquipements.map((eq) => eq._id.toString()));

      const missingIds = catalogIds.filter((id) => !foundIdsMap.has(id));
      if (missingIds.length > 0) {
        throw new NotFoundError(`Équipement(s) introuvable(s) dans le catalogue : ${missingIds.join(", ")}`);
      }
    }
  };

  // Retourne les options du formulaire pour l'UI dynamique
  static getPanneFormOptions = () => {
    return {
      types_panne: TYPE_PANNE,
      niveaux_urgence: NIVEAU_URGENCE,
      systemes: SYSTEMES,
      statuts: VALID_QUERY_STATUTS,
      impacts_par_type: IMPACTS_PAR_TYPE,
      tentatives_par_type: TENTATIVES_PAR_TYPE,
    };
  };

  static listPannes = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.niveau_urgence) {
      filter.niveau_urgence = query.niveau_urgence;
    }
    if (query.type_panne) {
      filter.type_panne = query.type_panne;
    }
    if (query.besoin_intervention !== undefined) {
      filter.besoin_intervention =
        query.besoin_intervention === "true" || query.besoin_intervention === true;
    }
    if (query.statut) {
      const rawStatus = query.statut.toLowerCase().trim();
      filter.statut = STATUS_MAP[rawStatus] || query.statut;
    }

    const [documents, total] = await PanneRepository.getAllPannes({
      skip,
      limit,
      filter,
    });

    const sorted = documents.sort(
      (a, b) =>
        (URGENCE_ORDER[a.niveau_urgence] ?? 99) -
        (URGENCE_ORDER[b.niveau_urgence] ?? 99)
    );

    return {
      data: sorted,
      meta: { page, limit, total },
    };
  };

  // Retourne les commandes liées à une panne — appelé dans le détail d'une panne
  static getCommandesForPanne = async (panneId) => {
    return CommandeModel.find({ panne: panneId, deletedAt: null })
      .populate('fournisseur')
      .populate('demandeur', 'nom prenom username tel type')
      .sort({ createdAt: -1 })
      .lean();
  };

  static getPanneById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant panne invalide");
    }

    const panne = await PanneRepository.getPanneById(id);
    if (!panne) {
      throw new NotFoundError(`Panne ${id} non trouvée`);
    }

    const commandes = await PanneService.getCommandesForPanne(id);

    return { ...panne.toObject(), commandes };
  };

  static createPanne = async (dto, userId) => {
    if (dto.equipements) {
      await PanneService.validateEquipementsExist(dto.equipements);
    }

    return PanneRepository.createPanne({
      ...dto,
      declarant: userId,
    });
  };

  static updatePanne = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant panne invalide");
    }

    const panne = await PanneRepository.getPanneById(id);
    if (!panne) {
      throw new NotFoundError(`Panne ${id} non trouvée`);
    }

    if (dto.equipements) {
      await PanneService.validateEquipementsExist(dto.equipements);
    }

    const updated = await PanneRepository.updatePanne(id, dto);
    if (!updated) {
      throw new NotFoundError(`Panne ${id} non trouvée`);
    }

    return updated;
  };

  static toggleStatut = async (id, { statut }) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant panne invalide");
    }

    const rawStatus = statut.toLowerCase().trim();
    const targetStatus = STATUS_MAP[rawStatus] || statut.toUpperCase();

    if (!STATUTS_PANNE.includes(targetStatus)) {
      throw new ValidationError(`Statut invalide : ${statut}`);
    }

    const panne = await PanneRepository.getPanneById(id);
    if (!panne) {
      throw new NotFoundError(`Panne ${id} non trouvée`);
    }

    const updated = await PanneRepository.updateStatut(id, targetStatus);
    if (!updated) {
      throw new NotFoundError(`Panne ${id} non trouvée`);
    }

    return updated;
  };

  static deletePanne = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant panne invalide");
    }

    const panne = await PanneRepository.getPanneById(id);
    if (!panne) {
      throw new NotFoundError(`Panne ${id} non trouvée`);
    }

    const success = await PanneRepository.deleteLogically(id);
    if (!success) {
      throw new NotFoundError(`Panne ${id} non trouvée ou déjà supprimée`);
    }
  };
}
