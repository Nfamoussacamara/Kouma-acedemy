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

const STATUS_MAP = {
  brouillon: "BROUILLON",
  emise: "EMISE",
  partiellement_recue: "PARTIELLEMENT_RECUE",
  recue: "RECUE",
  annulee: "ANNULEE",
  annulée: "ANNULEE",
};

function normalizeStatus(status) {
  if (!status) {
    throw new ValidationError("Le statut est obligatoire");
  }
  const key = String(status).toLowerCase().trim();
  return STATUS_MAP[key] || String(status).toUpperCase();
}

function computeTotal(equipements) {
  return (equipements || []).reduce(
    (total, ligne) => total + ligne.quantiteCommandee * ligne.prixUnitaire,
    0
  );
}
async function loadCatalogMap(equipements, { strict = false } = {}) {
  const equipementIds = (equipements || [])
    .filter((e) => e.equipement)
    .map((e) => e.equipement);

  if (equipementIds.length === 0) {
    return new Map();
  }

  const found = await EquipementRepository.getEquipementsByIds(equipementIds);
  const catalogMap = new Map(found.map((eq) => [eq._id.toString(), eq]));

  if (strict) {
    const missingIds = equipementIds.filter(
      (id) => !catalogMap.has(id.toString())
    );
    if (missingIds.length > 0) {
      throw new NotFoundError(
        `Équipement(s) introuvable(s) dans le catalogue : ${missingIds.join(", ")}`
      );
    }
  }

  return catalogMap;
}

function findExistingLine(existingEquipements, equipementDto) {
  const targetId = equipementDto.equipement?.toString();
  if (!targetId) return null;

  return (existingEquipements || []).find((line) => {
    if (!line.equipement) return false;
    const lineId = line.equipement._id
      ? line.equipement._id.toString()
      : line.equipement.toString();
    return lineId === targetId;
  });
}

function buildEquipementLine(
  equipementDto,
  { catalogMap, existingLine = null, utiliserPrixCatalogue = false }
) {
  const catalogItem = catalogMap.get(equipementDto.equipement.toString());
  const quantiteRecue = existingLine ? existingLine.quantiteRecue : 0;

  if (
    existingLine &&
    quantiteRecue > 0 &&
    equipementDto.prixUnitaire !== undefined &&
    equipementDto.prixUnitaire !== existingLine.prixUnitaire
  ) {
    throw new ConflictError(
      `Le prix de l'équipement est figé car des réceptions ont déjà eu lieu`
    );
  }

  let prixUnitaire = equipementDto.prixUnitaire;
  if (prixUnitaire === undefined || prixUnitaire === null) {
    prixUnitaire = existingLine ? existingLine.prixUnitaire : 0;
    if (
      prixUnitaire === 0 &&
      catalogItem?.prix &&
      (utiliserPrixCatalogue || existingLine)
    ) {
      prixUnitaire = catalogItem.prix;
    }
  } else if (utiliserPrixCatalogue && prixUnitaire === 0 && catalogItem?.prix) {
    prixUnitaire = catalogItem.prix;
  }

  return {
    equipement: equipementDto.equipement,
    quantiteCommandee: equipementDto.quantiteCommandee,
    quantiteRecue,
    prixUnitaire,
  };
}

export class CommandeService {
  static listCommandes = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const searchFilter = createSearchFilter(query.search, [
      "reference",
      "fournisseur.nom",
      "demandeur.prenom",
      "demandeur.nom",
      "equipements.equipement.designation",
    ]);

    const filter = { ...searchFilter };

    if (query.status) {
      filter.status = normalizeStatus(query.status);
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
    if (dto.panne && !isValidObjectId(dto.panne)) {
      throw new ValidationError(`Identifiant de panne invalide : ${dto.panne}`);
    }

    let panne = null;
    if (dto.panne) {
      panne = await PanneRepository.getPanneById(dto.panne);
      if (!panne) {
        throw new NotFoundError(`Panne introuvable : ${dto.panne}`);
      }
    }

    const fournisseur = await FournisseurRepository.getFournisseurById(
      dto.fournisseur
    );
    if (!fournisseur) {
      throw new NotFoundError("Fournisseur introuvable");
    }

    const catalogMap = await loadCatalogMap(dto.equipements, { strict: true });

    const equipements = dto.equipements.map((equipementDto) =>
      buildEquipementLine(equipementDto, {
        catalogMap,
        utiliserPrixCatalogue: dto.utiliserPrixCatalogue === true,
      })
    );

    const reference = await CounterService.nextCommandeNumber();
    const targetStatus = dto.status ? normalizeStatus(dto.status) : "BROUILLON";

    return CommandeRepository.createCommande({
      reference,
      panne: panne?._id || null,
      fournisseur: fournisseur._id,
      demandeur: userId,
      equipements,
      status: targetStatus,
      prixtotal: computeTotal(equipements),
    });
  };

  static updateCommande = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError(`Identifiant commande invalide : ${id}`);
    }

    const commande = await CommandeRepository.getCommandeById(id);
    if (!commande) {
      throw new NotFoundError(`Commande ${id} non trouvée`);
    }

    if (commande.status === "RECUE" || commande.status === "ANNULEE") {
      throw new ConflictError(
        `Une commande au statut ${commande.status} ne peut plus être modifiée`
      );
    }

    const fournisseurId =
      dto.fournisseur || commande.fournisseur?._id || commande.fournisseur;
    const fournisseur = await FournisseurRepository.getFournisseurById(
      fournisseurId
    );
    if (!fournisseur) {
      throw new NotFoundError(`Fournisseur ${fournisseurId} non trouvé`);
    }

    let equipements = commande.equipements;
    if (dto.equipements && Array.isArray(dto.equipements)) {
      const catalogMap = await loadCatalogMap(dto.equipements, { strict: true });

      equipements = dto.equipements.map((equipementDto) =>
        buildEquipementLine(equipementDto, {
          catalogMap,
          existingLine: findExistingLine(
            commande.equipements,
            equipementDto
          ),
        })
      );
    }

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
      equipements,
      prixtotal: computeTotal(equipements),
    });
  };

  static #applyReceptionItem = async (commande, item) => {
    if (!item.equipement) {
      throw new ValidationError(
        "L'identifiant d'équipement est requis pour réceptionner un équipement"
      );
    }

    const itemEquipementId = item.equipement.toString();

    const targetLine = commande.equipements.find((e) => {
      if (!e.equipement) return false;
      const lineEquipementId = e.equipement._id
        ? e.equipement._id.toString()
        : e.equipement.toString();
      return lineEquipementId === itemEquipementId;
    });

    if (!targetLine) {
      throw new ValidationError(
        "L'équipement réceptionné ne figure pas dans la commande initiale"
      );
    }

    const equipementId = targetLine.equipement._id || targetLine.equipement;

    const soldeACommander =
      targetLine.quantiteCommandee - targetLine.quantiteRecue;
    if (item.quantiteRecue > soldeACommander) {
      throw new ValidationError(
        `La quantité reçue (${item.quantiteRecue}) dépasse la quantité restante à recevoir (${soldeACommander})`
      );
    }

    targetLine.quantiteRecue += item.quantiteRecue;

    const prixApplique =
      item.prixUnitaire !== undefined && item.prixUnitaire !== null
        ? item.prixUnitaire
        : targetLine.prixUnitaire;

    targetLine.prixUnitaire = prixApplique;

    if (prixApplique > 0) {
      await EquipementService.enregistrerPrixAchat({
        equipementId,
        nouveauPrix: prixApplique,
        commandeId: commande._id,
        fournisseurId: commande.fournisseur,
      });
    }

    return {
      equipement: equipementId,
      quantiteRecue: item.quantiteRecue,
      prixUnitaire: prixApplique,
    };
  };

  static receptionnerCommande = async (id, dto, userId) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant commande invalide");
    }

    const commande = await CommandeRepository.getCommandeById(id);
    if (!commande) {
      throw new NotFoundError(`Commande ${id} non trouvée`);
    }

    if (commande.status === "RECUE" || commande.status === "ANNULEE") {
      throw new ConflictError(
        `Impossible d'enregistrer une réception sur une commande au statut ${commande.status}`
      );
    }

    const equipementsRecusLog = [];
    for (const item of dto.equipementsRecus) {
      equipementsRecusLog.push(
        await CommandeService.#applyReceptionItem(commande, item)
      );
    }

    const toutRecu = commande.equipements.every(
      (e) => e.quantiteRecue === e.quantiteCommandee
    );

    commande.status = toutRecu ? "RECUE" : "PARTIELLEMENT_RECUE";
    commande.prixtotal = computeTotal(commande.equipements);

    commande.receptions.push({
      reference: await CounterService.nextReceptionNumber(),
      date: new Date(),
      receptionnePar: userId,
      equipementsRecus: equipementsRecusLog,
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

    const targetStatus = normalizeStatus(status);

    if (targetStatus === "ANNULEE") {
      const aDejaRecu = commande.equipements.some((e) => e.quantiteRecue > 0);
      if (aDejaRecu) {
        throw new ConflictError(
          "Impossible d'annuler une commande qui a déjà fait l'objet d'une réception"
        );
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

    const aDejaRecu = commande.equipements.some((e) => e.quantiteRecue > 0);
    if (aDejaRecu) {
      throw new ConflictError(
        "Impossible de supprimer une commande qui a déjà fait l'objet d'une réception"
      );
    }

    const success = await CommandeRepository.deleteLogically(id);
    if (!success) {
      throw new NotFoundError(`Commande ${id} non trouvée ou déjà supprimée`);
    }
  };

  static getStats = async () => {
    return CommandeRepository.getStats();
  };
}