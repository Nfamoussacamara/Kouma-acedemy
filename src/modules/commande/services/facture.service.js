import cloudinary from '../../../config/cloudinary.js';
import { CommandeRepository } from '../repositories/commande.repository.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/AppError.js';

const CLOUDINARY_FOLDER = 'kouma-academy/commandes/factures';

export class FactureService {
  static #uploadToCloudinary = (fileBuffer, originalName, mimeType, commandeReference, receptionReference) => {
    return new Promise((resolve, reject) => {
      const resourceType = mimeType === 'application/pdf'
        ? 'raw'
        : 'image';
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${CLOUDINARY_FOLDER}/${commandeReference}/${receptionReference}`,
          resource_type: resourceType,
          filename_override: originalName,
          use_filename: true,
        },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(fileBuffer);
    });
  };

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

    const reception = FactureService.#getReceptionOrThrow(commande, receptionId);

    const result = await FactureService.#uploadToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
      commande.reference || commande._id,
      reception.reference || reception._id
    );
    
    return CommandeRepository.updateReceptionFacture(commandeId, receptionId, {
      nomOriginal: file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      mimeType: file.mimetype,
      taille: result.bytes,
      uploadedAt: new Date(),
      uploadedBy: userId
    });
  };

  static deleteFacture = async ({ commandeId, receptionId, userId }) => {
    const commande = await CommandeRepository.getCommandeById(commandeId);
    if (!commande) {
      throw new NotFoundError(`Commande ${commandeId} non trouvée`);
    }

    const reception = FactureService.#getReceptionOrThrow(commande, receptionId);

    if (!reception.facture?.publicId) {
      throw new ValidationError('Aucune facture associée à cette réception');
    }
    if (reception.facture.deletedAt) {
      throw new ValidationError('Cette facture est déjà supprimée');
    }

    return CommandeRepository.updateReceptionFacture(commandeId, receptionId, {
      ...reception.facture.toObject(),
      deletedAt: new Date(),
      deletedBy: userId
    });
  };

  static restoreFacture = async ({ commandeId, receptionId }) => {
    const commande = await CommandeRepository.getCommandeById(commandeId);
    if (!commande) {
      throw new NotFoundError(`Commande ${commandeId} non trouvée`);
    }

    const reception = FactureService.#getReceptionOrThrow(commande, receptionId);

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