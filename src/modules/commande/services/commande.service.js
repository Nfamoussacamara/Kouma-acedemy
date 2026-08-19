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
import { EquipementService } from "../../equipement/services/equipement.service.js";
import { PanneRepository } from "../../panne/repositories/panne.repository.js";
import { CounterService } from "./counter.service.js";
import { createSearchFilter } from "../../../shared/utils/search.util.js";
import { CommandeModel } from "../infrastructure/persistence/models/Commande.model.js";

const STATUS_MAP = {
  "brouillon": "BROUILLON",
  "emise": "EMISE",
  "partiellement_recue": "PARTIELLEMENT_RECUE",
  "recue": "RECUE",
  "annulee": "ANNULEE",
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
      "articles.designation",
      "articles.equipement.designation",
    ]);

    const filter = {
      ...searchFilter,
    };

    if (query.status) {
      const statusKey = query.status.toLowerCase().trim();
      filter.status = STATUS_MAP[statusKey] || query.status.toUpperCase();
    }

    if (query.fournisseur && isValidObjectId(query.fournisseur)) {
      filter.fournisseur = query.fournisseur;
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
    if (!isValidObjectId(dto.panne)) {
      throw new ValidationError(`Identifiant de panne invalide : ${dto.panne}`);
    }
    const panne = await PanneRepository.getPanneById(dto.panne);
    if (!panne) {
      throw new NotFoundError(`Panne introuvable : ${dto.panne}`);
    }

    const fournisseur = await FournisseurRepository.getFournisseurById(dto.fournisseur);
    if (!fournisseur) {
      throw new NotFoundError("Fournisseur introuvable");
    }

    const catalogEquipementIds = dto.articles
      .filter((a) => a.equipement)
      .map((a) => a.equipement);

    let catalogMap = new Map();
    if (catalogEquipementIds.length > 0) {
      const foundEquipements = await EquipementRepository.getEquipementsByIds(catalogEquipementIds);
      catalogMap = new Map(foundEquipements.map((eq) => [eq._id.toString(), eq]));

      const missingIds = catalogEquipementIds.filter((id) => !catalogMap.has(id.toString()));
      if (missingIds.length > 0) {
        throw new NotFoundError(`Équipement(s) introuvable(s) dans le catalogue : ${missingIds.join(", ")}`);
      }
    }

    const articles = dto.articles.map((article) => {
      let prixUnitaire = article.prixUnitaire ?? 0;
      let designation = article.designation;

      if (article.equipement) {
        const catalogItem = catalogMap.get(article.equipement.toString());
        if (!designation && catalogItem?.designation) {
          designation = catalogItem.designation;
        }
        if (dto.utiliserPrixCatalogue === true && prixUnitaire === 0 && catalogItem?.prix) {
          prixUnitaire = catalogItem.prix;
        }
      }

      return {
        equipement: article.equipement || null,
        typeEquipement: article.typeEquipement || null,
        designation: designation || null,
        quantiteCommandee: article.quantiteCommandee,
        quantiteRecue: 0,
        prixUnitaire,
      };
    });

    const prixtotal = articles.reduce(
      (acc, ligne) => acc + ligne.quantiteCommandee * ligne.prixUnitaire,
      0
    );

    const numero = await CounterService.nextCommandeNumber();
    const targetStatus = dto.status
      ? STATUS_MAP[dto.status.toLowerCase().trim()] || "BROUILLON"
      : "BROUILLON";

    return CommandeRepository.createCommande({
      numero,
      panne: dto.panne,
      fournisseur: fournisseur._id,
      demandeur: userId,
      articles,
      status: targetStatus,
      prixtotal,
    });
  };

  static updateCommande = async (id, dto, userId) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("ID de commande invalide");
    }

    const commande = await CommandeRepository.getCommandeById(id);
    if (!commande) {
      throw new NotFoundError("Commande introuvable");
    }

    if (commande.status === "RECUE" || commande.status === "ANNULEE") {
      throw new ConflictError(`Une commande au statut ${commande.status} ne peut plus être modifiée`);
    }

    const fournisseurId = dto.fournisseur || commande.fournisseur?._id || commande.fournisseur;
    const fournisseur = await FournisseurRepository.getFournisseurById(fournisseurId);
    if (!fournisseur) {
      throw new NotFoundError("Fournisseur introuvable");
    }

    let articles = commande.articles;
    if (dto.articles && Array.isArray(dto.articles)) {
      const catalogEquipementIds = dto.articles
        .filter((a) => a.equipement)
        .map((a) => a.equipement);

      let catalogMap = new Map();
      if (catalogEquipementIds.length > 0) {
        const foundEquipements = await EquipementRepository.getEquipementsByIds(catalogEquipementIds);
        catalogMap = new Map(foundEquipements.map((eq) => [eq._id.toString(), eq]));
      }

      articles = dto.articles.map((article) => {
        const existingLine = (commande.articles || []).find(
          (line) =>
            (line.equipement && line.equipement._id?.toString() === article.equipement?.toString()) ||
            (line.typeEquipement && line.typeEquipement._id?.toString() === article.typeEquipement?.toString())
        );

        let quantiteRecue = existingLine ? existingLine.quantiteRecue : 0;
        let prixUnitaire = article.prixUnitaire;

        if (existingLine && quantiteRecue > 0 && article.prixUnitaire !== undefined && article.prixUnitaire !== existingLine.prixUnitaire) {
          throw new ConflictError(
            `Le prix de l'article "${existingLine.designation || 'Équipement'}" est figé car des réceptions ont déjà eu lieu`
          );
        }

        if (prixUnitaire === undefined || prixUnitaire === null) {
          prixUnitaire = existingLine ? existingLine.prixUnitaire : 0;
          if (prixUnitaire === 0 && article.equipement) {
            const catalogItem = catalogMap.get(article.equipement.toString());
            prixUnitaire = catalogItem?.prix || 0;
          }
        }

        return {
          equipement: article.equipement || existingLine?.equipement || null,
          typeEquipement: article.typeEquipement || existingLine?.typeEquipement || null,
          designation: article.designation || existingLine?.designation || null,
          quantiteCommandee: article.quantiteCommandee,
          quantiteRecue,
          prixUnitaire,
        };
      });
    }

    const prixtotal = articles.reduce(
      (acc, ligne) => acc + ligne.quantiteCommandee * ligne.prixUnitaire,
      0
    );

    let panneId = commande.panne?._id || commande.panne;
    if (dto.panne) {
      if (!isValidObjectId(dto.panne)) {
        throw new ValidationError(`Identifiant de panne invalide : ${dto.panne}`);
      }
      const panne = await PanneRepository.getPanneById(dto.panne);
      if (!panne) {
        throw new NotFoundError(`Panne introuvable : ${dto.panne}`);
      }
      panneId = dto.panne;
    }

    return CommandeRepository.updateCommande(id, {
      panne: panneId,
      fournisseur: fournisseur._id,
      articles,
      prixtotal,
    });
  };


  static receptionnerCommande = async (id, dto, userId) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant commande invalide");
    }

    const commande = await CommandeModel.findOne({ _id: id, deletedAt: null });
    if (!commande) {
      throw new NotFoundError(`Commande ${id} non trouvée`);
    }

    if (commande.status === "RECUE" || commande.status === "ANNULEE") {
      throw new ConflictError(`Impossible d'enregistrer une réception sur une commande au statut ${commande.status}`);
    }

    const receptionArticlesLog = [];

    for (const item of dto.articlesRecus) {
      let targetArticle = commande.articles.find((a) => {
        if (item.equipement && a.equipement) {
          return a.equipement.toString() === item.equipement.toString();
        }
        if (item.typeEquipement && a.typeEquipement) {
          return a.typeEquipement.toString() === item.typeEquipement.toString();
        }
        return false;
      });

      if (!targetArticle) {
        throw new ValidationError("L'article réceptionné ne figure pas dans la commande initiale");
      }

      let equipementId = targetArticle.equipement;

      if (!equipementId && targetArticle.typeEquipement) {
        const newEquipement = await EquipementService.createEquipement({
          designation: targetArticle.designation || "Équipement Réceptionné",
          type: targetArticle.typeEquipement,
          fournisseur: commande.fournisseur,
          modele: targetArticle.modele || null,
          prix: item.prixUnitaire ?? targetArticle.prixUnitaire ?? 0,
        });

        equipementId = newEquipement._id;
        targetArticle.equipement = equipementId;
      }

      const soldeACommander = targetArticle.quantiteCommandee - targetArticle.quantiteRecue;
      if (item.quantiteRecue > soldeACommander) {
        throw new ValidationError(
          `La quantité reçue (${item.quantiteRecue}) dépasse la quantité restante à recevoir (${soldeACommander})`
        );
      }

      targetArticle.quantiteRecue += item.quantiteRecue;

      const prixApplique = item.prixUnitaire !== undefined && item.prixUnitaire !== null
        ? item.prixUnitaire
        : targetArticle.prixUnitaire;

      targetArticle.prixUnitaire = prixApplique;

      if (equipementId && prixApplique > 0) {
        await EquipementService.enregistrerPrixAchat({
          equipementId,
          nouveauPrix: prixApplique,
          commandeId: commande._id,
          fournisseurId: commande.fournisseur,
        });
      }

      receptionArticlesLog.push({
        equipement: equipementId,
        quantiteRecue: item.quantiteRecue,
        prixUnitaire: prixApplique,
      });
    }

    const toutRecu = commande.articles.every(
      (a) => a.quantiteRecue >= a.quantiteCommandee
    );

    commande.status = toutRecu ? "RECUE" : "PARTIELLEMENT_RECUE";
    commande.prixtotal = commande.articles.reduce(
      (acc, l) => acc + l.quantiteCommandee * l.prixUnitaire,
      0
    );

    commande.receptions.push({
      date: new Date(),
      receptionnePar: userId,
      articlesRecus: receptionArticlesLog,
    });

    await commande.save();

    return CommandeRepository.getCommandeById(id);
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

    if (targetStatus === "ANNULEE") {
      const aDejaRecu = commande.articles.some((a) => a.quantiteRecue > 0);
      if (aDejaRecu) {
        throw new ConflictError("Impossible d'annuler une commande qui a déjà fait l'objet d'une réception");
      }
    }

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

    const aDejaRecu = commande.articles.some((a) => a.quantiteRecue > 0);
    if (aDejaRecu) {
      throw new ConflictError("Impossible de supprimer une commande qui a déjà fait l'objet d'une réception");
    }

    const success = await CommandeRepository.deleteLogically(id);
    if (!success) {
      throw new NotFoundError(`Commande ${id} non trouvée ou déjà supprimée`);
    }
  };
}
