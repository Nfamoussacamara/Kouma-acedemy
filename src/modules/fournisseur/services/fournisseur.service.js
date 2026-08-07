import { NotFoundError, ConflictError, ValidationError } from '../../../shared/errors/AppError.js';
import { FournisseurRepository } from '../repositories/fournisseur.repository.js';
import { EquipementRepository } from '../../equipement/repositories/equipement.repository.js';
import { isValidObjectId } from '../../../infrastructure/database/mongoose.js';

export class FournisseurService {
  static listFournisseurs = async (query = {}) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    
    const skip = (page - 1) * limit;

    const [documents, total] = await FournisseurRepository.findAll({ skip, limit });

    return {
      data: documents,
      meta: { page, limit, total },
    };
  };

  static getFournisseurById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }
    const fournisseur = await FournisseurRepository.findById(id);
    if (!fournisseur) {
      throw new NotFoundError(`Fournisseur ${id} non trouvé`);
    }
    return fournisseur;
  };

  static createFournisseur = async (dto) => {
    return FournisseurRepository.create(dto);
  };

  static updateFournisseur = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }
    const updated = await FournisseurRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundError(`Fournisseur ${id} non trouvé`);
    }
    return updated;
  };

  static deleteFournisseur = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }
    // 1. Vérifier si le fournisseur existe
    const fournisseur = await FournisseurRepository.findById(id);
    if (!fournisseur) {
      throw new NotFoundError(`Fournisseur ${id} non trouvé`);
    }

    // 2. Vérifier s'il est lié à des équipements actifs (dans le parc)
    const countActive = await EquipementRepository.countActiveByProvider(id);
    if (countActive > 0) {
      throw new ConflictError(
        'Impossible de supprimer ce fournisseur car il possède encore des équipements actifs dans le parc'
      );
    }

    // 3. Supprimer le fournisseur
    await FournisseurRepository.delete(id);
  };

  static recalculateMontant = async (fournisseurId) => {
    if (!isValidObjectId(fournisseurId)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }
    const sumResult = await EquipementRepository.sumPricesByProvider(fournisseurId);
    await FournisseurRepository.updateMontant(fournisseurId, sumResult);
  };
}
