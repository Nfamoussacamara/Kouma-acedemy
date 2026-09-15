import { isValidObjectId } from "../../../infrastructure/database/mongoose.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../../../shared/errors/AppError.js";
import { CommandeRepository } from "../repositories/commande.repository.js";
import { STATUT_PAIEMENT, STATUT_COMMANDE } from "../commande.constance.js";
import { CounterService } from "./counter.service.js";

export class PaiementService {
  static async getPaiementById(commandeId, paiementId) {
    if (!isValidObjectId(commandeId)) {
      throw new ValidationError("Id de commande invalide");
    }

    if (!isValidObjectId(paiementId)) {
      throw new ValidationError("Id de paiement invalide");
    }

    const paiement = await CommandeRepository.getPaiementById(
      commandeId,
      paiementId,
    );

    if (!paiement) {
      throw new NotFoundError("Paiement non trouvé");
    }

    return paiement;
  }

  static async createPaiement(commandeId, paiementData, user) {
    if (!isValidObjectId(commandeId)) {
      throw new ValidationError("Id de commande invalide");
    }

    const commande = await CommandeRepository.getCommandeById(commandeId);

    if (!commande) {
      throw new NotFoundError("Commande non trouvée");
    }

    if (commande.status === STATUT_COMMANDE.ANNULEE) {
      throw new ConflictError(
        "Impossible d'enregistrer un paiement pour une commande annulée",
      );
    }

    const totalPaye = (commande.paiements ?? []).reduce(
      (total, paiement) => total + paiement.montant,
      0,
    );

    const nouveauTotalPaye = totalPaye + paiementData.montant;

    if (nouveauTotalPaye > commande.prixtotal) {
      throw new ConflictError(
        "Le montant total payé dépasse le montant de la commande",
      );
    }

    let statusPaiement;

    if (nouveauTotalPaye === 0) {
      statusPaiement = STATUT_PAIEMENT.NON_PAYE;
    } else if (nouveauTotalPaye < commande.prixtotal) {
      statusPaiement = STATUT_PAIEMENT.PARTIELLEMENT_PAYE;
    } else {
      statusPaiement = STATUT_PAIEMENT.PAYE;
    }

    const reference = await CounterService.nextPaymentNumber();

    return CommandeRepository.addPaiement(
      commandeId,
      {
        reference,
        montant: paiementData.montant,
        date: paiementData.date ?? new Date(),
        payePar: user?.id || user?._id,
      },
      statusPaiement,
    );
  }

  static updatePaiement = async (commandeId, paiementId, paiementData) => {
    if (!isValidObjectId(commandeId)) {
      throw new ValidationError("Id de commande invalide");
    }

    if (!isValidObjectId(paiementId)) {
      throw new ValidationError("Id de paiement invalide");
    }

    const commande = await CommandeRepository.getCommandeById(commandeId);

    if (!commande) {
      throw new NotFoundError("Commande non trouvée");
    }

    if (commande.status === STATUT_COMMANDE.ANNULEE) {
      throw new ConflictError(
        "Impossible de modifier un paiement d'une commande annulée"
      );
    }

    const paiement = commande.paiements.find(
      (item) => item._id.toString() === paiementId
    );

    if (!paiement) {
      throw new NotFoundError("Paiement non trouvé");
    }

    const totalPaye =
      commande.paiements.reduce(
        (total, item) => total + item.montant,
        0
      ) - paiement.montant;

    const nouveauTotalPaye = totalPaye + paiementData.montant;

    if (nouveauTotalPaye > commande.prixtotal) {
      throw new ConflictError(
        "Le montant total payé dépasse le montant de la commande"
      );
    }

    let statusPaiement;

    if (nouveauTotalPaye === 0) {
      statusPaiement = STATUT_PAIEMENT.NON_PAYE;
    } else if (nouveauTotalPaye < commande.prixtotal) {
      statusPaiement = STATUT_PAIEMENT.PARTIELLEMENT_PAYE;
    } else {
      statusPaiement = STATUT_PAIEMENT.PAYE;
    }

    return CommandeRepository.updatePaiement(
      commandeId,
      paiementId,
      {
        ...paiementData,
      },
      statusPaiement
    );
  };
  static deletePaiement = async (commandeId, paiementId) => {
    if (!isValidObjectId(commandeId)) {
      throw new ValidationError("Id de commande invalide");
    }

    if (!isValidObjectId(paiementId)) {
      throw new ValidationError("Id de paiement invalide");
    }

    const commande = await CommandeRepository.getCommandeById(commandeId);

    if (!commande) {
      throw new NotFoundError("Commande non trouvée");
    }

    if (commande.status === STATUT_COMMANDE.ANNULEE) {
      throw new ConflictError(
        "Impossible de supprimer un paiement d'une commande annulée"
      );
    }

    const paiement = commande.paiements.find(
      (item) => item._id.toString() === paiementId
    );

    if (!paiement) {
      throw new NotFoundError("Paiement non trouvé");
    }

    const totalPayeApres =
      commande.paiements.reduce(
        (total, item) => total + item.montant,
        0
      ) - paiement.montant;

    let statusPaiement;

    if (totalPayeApres === 0) {
      statusPaiement = STATUT_PAIEMENT.NON_PAYE;
    } else if (totalPayeApres < commande.prixtotal) {
      statusPaiement = STATUT_PAIEMENT.PARTIELLEMENT_PAYE;
    } else {
      statusPaiement = STATUT_PAIEMENT.PAYE;
    }

    return CommandeRepository.deletePaiement(
      commandeId,
      paiementId,
      statusPaiement
    );
  };
}

export default PaiementService;