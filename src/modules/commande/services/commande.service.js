import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../../../shared/errors/AppError.js";
import { isValidObjectId } from "../../../infrastructure/database/mongoose.js";
import { getPagination } from "../../../shared/utils/pagination.util.js";
import { CommandeRepository } from "../repositories/commande.repository.js";
import { FournisseurRepository } from "../../fournisseur/repositories/fournisseur.repository.js";
import { EquipementRepository } from "../../equipement/repositories/equipement.repository.js";
import { CounterService } from "./counter.service.js";
import { createSearchFilter } from "../../../shared/utils/search.util.js";

const STATUS_MAP = {
  "en_attente": "EN_ATTENTE",
  "en_cours": "EN_COURS",
  "livrée": "LIVREE",
  "annulée": "ANNULEE",
};

export class CommandeService {
  static listCommandes = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const searchFilter = createSearchFilter(query.search, [
      "numero",
      "fournisseur.nom",
      "demandeur.prenom",
      "demandeur.nom",
      "articles.equipement.designation",
    ]);

    const filter = {
      ...searchFilter,
    };

    if (query.status) {
      const status = query.status.toLowerCase().trim();
      filter.status = STATUS_MAP[status];
    }
    
    const [documents, total] = await CommandeRepository.getAllCommandes({
      skip,
      limit,
      filter,
    });

    return {
      data: documents,
      meta: { page, limit, total },
    };
  };

  static getCommandeById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant commande invalide");
    }

    const commande = await CommandeRepository.getCommandeById(id);
    if (!commande) {
      throw new NotFoundError(`Commande ${id} non trouvée`);
    }

    return commande;
  };

  static createCommande = async (dto, userId) => {

    const equipementIds = dto.articles.map((article) => article.equipement);
    const uniqueIds = new Set(equipementIds.map((id) => id?.toString()));

    if (uniqueIds.size !== equipementIds.length) {
      throw new ValidationError(
        "Un même équipement ne peut apparaître qu'une seule fois dans la commande",
      );
    }

    const [fournisseur, equipements] = await Promise.all([
      FournisseurRepository.getFournisseurById(dto.fournisseur),
      EquipementRepository.getEquipementsByIds(equipementIds),
    ]);

    if (!fournisseur) {
      throw new NotFoundError("Fournisseur introuvable");
    }

    const foundIds = new Set(
      equipements.map((equipement) => equipement._id.toString()),
    );

    const missingIds = equipementIds.filter(
      (id) => !foundIds.has(id?.toString()),
    );

    if (missingIds.length > 0) {
      throw new NotFoundError(
        `Équipement(s) introuvable(s) : ${missingIds.join(", ")}`,
      );
    }

    const equipementsMap = new Map(
      equipements.map((equipement) => [equipement._id.toString(), equipement]),
    );

    const articles = dto.articles.map((article) => {
      const equipement = equipementsMap.get(article.equipement.toString());

      return {
        equipement: equipement._id,
        quantiteCommandee: article.quantiteCommandee,
        quantiteLivree: 0,
        prixUnitaire: equipement.prix,
      };
    });

    const prixtotal = articles.reduce(
      (acc, ligne) => acc + ligne.quantiteCommandee * ligne.prixUnitaire,
      0,
    );

    const numero = await CounterService.nextCommandeNumber();

    return CommandeRepository.createCommande({
      numero,
      fournisseur: fournisseur._id,
      demandeur: userId,
      articles,
      prixtotal,
    });
  };

  static updateCommande = async (id, dto, userId) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("ID de commande invalide");
    }

    const commande = await CommandeRepository.getCommandeById(id,);

    if (!commande) {
      throw new NotFoundError("Commande introuvable");
    }

    if (commande.statut !== "EN_ATTENTE") {
      throw new ConflictError("Cette commande ne peut plus être modifiée car son statut n'est plus EN_ATTENTE");
    }

    const equipementIds = dto.articles.map((article) => article.equipement);
    const uniqueIds = new Set(equipementIds.map((id) => id?.toString()));

    if (uniqueIds.size !== equipementIds.length) {
      throw new ValidationError(
        "Un même équipement ne peut apparaître qu'une seule fois dans la commande",
      );
    }

    const fournisseurId = dto.fournisseur || commande.fournisseur?._id || commande.fournisseur;

    const [fournisseur, equipements] = await Promise.all([
      FournisseurRepository.getFournisseurById(fournisseurId),
      EquipementRepository.getEquipementsByIds(equipementIds),
    ]);

    if (!fournisseur) {
      throw new NotFoundError("Fournisseur introuvable");
    }

    const foundIds = new Set(
      equipements.map((equipement) => equipement._id.toString()),
    );

    const missingIds = equipementIds.filter(
      (id) => !foundIds.has(id?.toString()),
    );

    if (missingIds.length > 0) {
      throw new NotFoundError(
        `Équipement(s) introuvable(s) : ${missingIds.join(", ")}`,
      );
    }

    const equipementsMap = new Map(
      equipements.map((equipement) => [equipement._id.toString(), equipement]),
    );

    const articles = dto.articles.map((article) => {
      const equipement = equipementsMap.get(article.equipement.toString());

      const ancienneLigne = (commande.articles || []).find(
        (ligne) =>
          ligne.equipement?._id?.toString() === article.equipement.toString() ||
          ligne.equipement?.toString() === article.equipement.toString(),
      );

      return {
        equipement: equipement._id,
        quantiteCommandee: article.quantiteCommandee,
        quantiteLivree: ancienneLigne ? ancienneLigne.quantiteLivree : 0,
        prixUnitaire: equipement.prix,
      };
    });

    const prixtotal = articles.reduce(
      (acc, ligne) => acc + ligne.quantiteCommandee * ligne.prixUnitaire,
      0,
    );

    return CommandeRepository.updateCommande(id, {
      fournisseur: fournisseur._id,
      articles,
      prixtotal,
    });
  };

  static toggleCommandeStatus = async (id, { status }) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant commande invalide");
    }

    const commande = await CommandeRepository.getCommandeById(id);
    if (!commande) {
      throw new NotFoundError(`Commande ${id} non trouvée`);
    }

    const targetStatus = STATUS_MAP[status.toLowerCase().trim()] || status.toUpperCase();

    const updated = await CommandeRepository.updateStatus(id, targetStatus);
    if (!updated) {
      throw new NotFoundError(`Commande ${id} non trouvée`);
    }

    return updated;
  };

  static deleteCommande = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant commande invalide");
    }

    const commande = await CommandeRepository.getCommandeById(id);
    if (!commande) {
      throw new NotFoundError(`Commande ${id} non trouvée`);
    }

    const success = await CommandeRepository.deleteLogically(id);
    if (!success) {
      throw new NotFoundError(`Commande ${id} non trouvée ou déjà supprimée`);
    }
  };
}
