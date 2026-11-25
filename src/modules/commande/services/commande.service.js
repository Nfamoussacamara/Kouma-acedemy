import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
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
import { STATUT_COMMANDE } from "../commande.constance.js";

function normalizeStatus(status) {
  if (!status) {
    throw new ValidationError("Le statut est obligatoire");
  }
  const key = String(status).trim().toLowerCase();
  const valid = { en_attente: "en_attente", commandee: "commandee", recu: "recu" };
  if (!valid[key]) {
    throw new ValidationError(`Statut invalide : ${status}`);
  }
  return valid[key];
}

// prixtotal = somme(quantiteRecue * prixUnitaire)
function computeTotalRecu(equipements) {
  return (equipements || []).reduce(
    (total, ligne) => total + (ligne.quantiteRecue || 0) * (ligne.prixUnitaire || 0),
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

  // quantiteDemandee ne change JAMAIS, conservée pour traçabilité
  const quantiteDemandee = existingLine
    ? (existingLine.quantiteDemandee ?? existingLine.quantiteCommandee)
    : (equipementDto.quantiteDemandee ?? equipementDto.quantiteCommandee);

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

  // quantiteCommandee ou quantiteValidee ajustée par l'Admin
  const quantiteCommandee =
    equipementDto.quantiteValidee ??
    equipementDto.quantiteCommandee ??
    (existingLine ? existingLine.quantiteCommandee : 1);

  return {
    equipement: equipementDto.equipement,
    quantiteDemandee,
    quantiteCommandee,
    quantiteRecue,
    prixUnitaire,
  };
}

export class CommandeService {
  static listCommandes = async (query = {}, user = {}) => {
    const { page, limit, skip } = getPagination(query);
    const searchFilter = createSearchFilter(query.search, [
      "reference",
      "fournisseur.nom",
      "demandeur.prenom",
      "demandeur.nom",
      "equipements.equipement.designation",
    ]);

    const filter = { ...searchFilter };

    // filtrage par rôle — Utilisateur voit ses commandes + celles créées par l'admin pour sa structure
    if (user?.type === "Utilisateur") {
      if (user.structure_sanitaire) {
        filter.$or = [
          { demandeur: user.id },
          { creeParAdmin: true, structure_sanitaire: user.structure_sanitaire },
        ];
      } else {
        filter.demandeur = user.id;
      }
    }

    // Admin : filtrage explicite optionnel par ?demandeur=<userId>
    if (user?.type === "Admin" && query.demandeur && isValidObjectId(query.demandeur)) {
      filter.demandeur = query.demandeur;
    }

    // Admin : filtrage optionnel par structure sanitaire
    if (user?.type === "Admin" && query.structure_sanitaire) {
      filter.structure_sanitaire = query.structure_sanitaire;
    }

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

  static getCommandeById = async (id, user = {}) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant commande invalide");
    }

    const commande = await CommandeRepository.getCommandeById(id);
    if (!commande) {
      throw new NotFoundError(`Commande ${id} non trouvée`);
    }

    if (user?.type === "Utilisateur") {
      const isOwner = commande.demandeur?.id === user.id;
      const isMembreStructure =
        commande.creeParAdmin &&
        user.structure_sanitaire &&
        commande.structure_sanitaire?.includes(user.structure_sanitaire);

      if (!isOwner && !isMembreStructure) {
        throw new ForbiddenError("Accès refusé à cette commande");
      }
    }

    return commande;
  };

  static createCommande = async (dto, user) => {
    const userId = user.id ?? user._id;
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

    // fournisseur optionnel à la création (l'Admin l'assignera lors de la validation)
    let fournisseurId = null;
    if (dto.fournisseur) {
      const fournisseur = await FournisseurRepository.getFournisseurById(dto.fournisseur);
      if (!fournisseur) {
        throw new NotFoundError("Fournisseur introuvable");
      }
      fournisseurId = fournisseur._id;
    }

    const catalogMap = await loadCatalogMap(dto.equipements, { strict: true });

    // quantiteDemandee = copie immuable de quantiteCommandee à la création
    const equipements = dto.equipements.map((equipementDto) => ({
      ...buildEquipementLine(equipementDto, {
        catalogMap,
        utiliserPrixCatalogue: false,
      }),
      quantiteDemandee: equipementDto.quantiteCommandee,
    }));

    const reference = await CounterService.nextCommandeNumber();

    // statut par défaut = en_attente ; prixtotal = 0 à la création
    return CommandeRepository.createCommande({
      reference,
      panne: panne?._id || null,
      fournisseur: fournisseurId,
      demandeur: userId,
      createdBy: userId,
      equipements,
      status: STATUT_COMMANDE.EN_ATTENTE,
      prixtotal: 0,
      // champs spécifiques aux commandes créées par l'admin pour une structure
      creeParAdmin: user.type === "Admin" ? (dto.creeParAdmin ?? false) : false,
      structure_sanitaire: user.type === "Admin" ? (dto.structure_sanitaire ?? []) : [],
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

    if (commande.status === STATUT_COMMANDE.RECU) {
      throw new ConflictError(
        `Une commande au statut ${commande.status} ne peut plus être modifiée`
      );
    }

    const fournisseurId =
      dto.fournisseur || commande.fournisseur?._id || commande.fournisseur;
    let fournisseur = null;
    if (fournisseurId) {
      fournisseur = await FournisseurRepository.getFournisseurById(
        fournisseurId
      );
      if (!fournisseur) {
        throw new NotFoundError(`Fournisseur ${fournisseurId} non trouvé`);
      }
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

    let targetStatus = commande.status;
    if (dto.status) {
      targetStatus = normalizeStatus(dto.status);
    } else if (commande.status === STATUT_COMMANDE.EN_ATTENTE && fournisseur) {
      // quand l'admin sélectionne le fournisseur et valide, le statut passe à "commandee"
      targetStatus = STATUT_COMMANDE.COMMANDEE;
    }

    return CommandeRepository.updateCommande(id, {
      panne: panneId,
      fournisseur: fournisseur?._id || null,
      equipements,
      status: targetStatus,
      prixtotal: computeTotalRecu(equipements),
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

    if (commande.status === STATUT_COMMANDE.RECU) {
      throw new ConflictError(
        `Impossible d'enregistrer une réception sur une commande au statut ${commande.status}`
      );
    }

    if (commande.status !== STATUT_COMMANDE.COMMANDEE) {
      throw new ConflictError(
        `La réception n'est possible que sur une commande au statut "commandee" (statut actuel : ${commande.status})`
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

    // passage à "recu" si tout est livré, sinon "commandee"
    commande.status = toutRecu ? STATUT_COMMANDE.RECU : STATUT_COMMANDE.COMMANDEE;
    // calcul automatique du prixtotal à la réception : somme(quantiteRecue * prixUnitaire)
    commande.prixtotal = computeTotalRecu(commande.equipements);

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

    if (targetStatus === STATUT_COMMANDE.RECU) {
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