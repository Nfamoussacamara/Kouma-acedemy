import cloudinary from '../../../config/cloudinary.js';
import { CommandeRepository } from '../repositories/commande.repository.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../../../shared/errors/AppError.js';
import { isValidObjectId } from '../../../infrastructure/database/mongoose.js';

const FOLDER_FACTURES = 'kouma-academy/commandes/factures';
const FOLDER_BONS_SIGNES = 'kouma-academy/commandes/bons-signes';

export class DocumentService {
  /**
   * Envoi d'un fichier bufferisé vers Cloudinary en streaming
   */
  static uploadToCloudinary = (fileBuffer, originalName, mimeType, folder) => {
    return new Promise((resolve, reject) => {
      const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          filename_override: originalName,
          use_filename: true,
        },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(fileBuffer);
    });
  };

  /* ──────────────────────────────────────────────────────────────────────────
   *  BON DE COMMANDE SIGNÉ
   * ────────────────────────────────────────────────────────────────────────── */

  static uploadBonSigne = async ({ commandeId, file, user }) => {
    if (!file) {
      throw new ValidationError("Aucun fichier fourni (champ 'file' attendu)");
    }

    if (!isValidObjectId(commandeId)) {
      throw new ValidationError('Identifiant commande invalide');
    }

    const commande = await CommandeRepository.getCommandeById(commandeId);
    if (!commande) {
      throw new NotFoundError(`Commande ${commandeId} non trouvée`);
    }

    const demandeurId =
      commande.demandeur?._id?.toString() || commande.demandeur?.toString();
    const isOwner = demandeurId === user.id;
    const isAdmin = user.type === 'Admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à téléverser le bon de commande pour cette demande"
      );
    }

    const folder = `${FOLDER_BONS_SIGNES}/${commande.reference || commande._id}`;
    const result = await DocumentService.uploadToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder
    );

    const bonSigneData = {
      url: result.secure_url,
      publicId: result.public_id,
      nomOriginal: file.originalname,
      taille: result.bytes,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: user.id,
      deletedAt: null,
      deletedBy: null,
    };

    return CommandeRepository.updateBonSigne(commandeId, bonSigneData);
  };

  static deleteBonSigne = async ({ commandeId, user }) => {
    if (!isValidObjectId(commandeId)) {
      throw new ValidationError('Identifiant commande invalide');
    }

    const commande = await CommandeRepository.getCommandeById(commandeId);
    if (!commande) {
      throw new NotFoundError(`Commande ${commandeId} non trouvée`);
    }

    const demandeurId =
      commande.demandeur?._id?.toString() || commande.demandeur?.toString();
    const isOwner = demandeurId === user.id;
    const isAdmin = user.type === 'Admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à modifier le bon de commande de cette demande"
      );
    }

    if (!commande.bonSigne?.publicId) {
      throw new ValidationError('Aucun bon de commande signé associé à cette commande');
    }

    if (commande.bonSigne.deletedAt) {
      throw new ValidationError('Ce bon de commande signé est déjà supprimé');
    }

    const bonSigneData = {
      ...(commande.bonSigne.toObject ? commande.bonSigne.toObject() : commande.bonSigne),
      deletedAt: new Date(),
      deletedBy: user.id,
    };

    return CommandeRepository.updateBonSigne(commandeId, bonSigneData);
  };

  static restoreBonSigne = async ({ commandeId, user }) => {
    if (!isValidObjectId(commandeId)) {
      throw new ValidationError('Identifiant commande invalide');
    }

    const commande = await CommandeRepository.getCommandeById(commandeId);
    if (!commande) {
      throw new NotFoundError(`Commande ${commandeId} non trouvée`);
    }

    if (user.type !== 'Admin') {
      throw new ForbiddenError('Seul un administrateur peut restaurer un bon signé');
    }

    if (!commande.bonSigne?.publicId) {
      throw new ValidationError('Aucun bon de commande signé associé à cette commande');
    }

    if (!commande.bonSigne.deletedAt) {
      throw new ValidationError("Ce bon de commande signé n'est pas supprimé");
    }

    const bonSigneData = {
      ...(commande.bonSigne.toObject ? commande.bonSigne.toObject() : commande.bonSigne),
      deletedAt: null,
      deletedBy: null,
    };

    return CommandeRepository.updateBonSigne(commandeId, bonSigneData);
  };

  /* ──────────────────────────────────────────────────────────────────────────
   *  FACTURES DE RÉCEPTION
   * ────────────────────────────────────────────────────────────────────────── */

  static #getReceptionOrThrow = (commande, receptionId) => {
    const reception = commande.receptions.id(receptionId);
    if (!reception) {
      throw new NotFoundError(`Réception ${receptionId} non trouvée sur cette commande`);
    }
    return reception;
  };

  static uploadFacture = async ({ commandeId, receptionId, file, userId }) => {
    if (!file) {
      throw new ValidationError('Aucun fichier fourni');
    }

    const commande = await CommandeRepository.getCommandeById(commandeId);
    if (!commande) {
      throw new NotFoundError(`Commande ${commandeId} non trouvée`);
    }

    const reception = DocumentService.#getReceptionOrThrow(commande, receptionId);

    const folder = `${FOLDER_FACTURES}/${commande.reference || commande._id}/${reception.reference || reception._id}`;
    const result = await DocumentService.uploadToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder
    );

    return CommandeRepository.updateReceptionFacture(commandeId, receptionId, {
      nomOriginal: file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      mimeType: file.mimetype,
      taille: result.bytes,
      uploadedAt: new Date(),
      uploadedBy: userId,
      deletedAt: null,
      deletedBy: null,
    });
  };

  static deleteFacture = async ({ commandeId, receptionId, userId }) => {
    const commande = await CommandeRepository.getCommandeById(commandeId);
    if (!commande) {
      throw new NotFoundError(`Commande ${commandeId} non trouvée`);
    }

    const reception = DocumentService.#getReceptionOrThrow(commande, receptionId);

    if (!reception.facture?.publicId) {
      throw new ValidationError('Aucune facture associée à cette réception');
    }
    if (reception.facture.deletedAt) {
      throw new ValidationError('Cette facture est déjà supprimée');
    }

    return CommandeRepository.updateReceptionFacture(commandeId, receptionId, {
      ...reception.facture.toObject(),
      deletedAt: new Date(),
      deletedBy: userId,
    });
  };

  static restoreFacture = async ({ commandeId, receptionId }) => {
    const commande = await CommandeRepository.getCommandeById(commandeId);
    if (!commande) {
      throw new NotFoundError(`Commande ${commandeId} non trouvée`);
    }

    const reception = DocumentService.#getReceptionOrThrow(commande, receptionId);

    if (!reception.facture?.publicId) {
      throw new ValidationError('Aucune facture associée à cette réception');
    }
    if (!reception.facture.deletedAt) {
      throw new ValidationError("Cette facture n'est pas supprimée");
    }

    return CommandeRepository.updateReceptionFacture(commandeId, receptionId, {
      ...reception.facture.toObject(),
      deletedAt: null,
      deletedBy: null,
    });
  };
}
