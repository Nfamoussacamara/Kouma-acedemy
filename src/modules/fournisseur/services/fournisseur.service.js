import { NotFoundError, ConflictError, ValidationError } from '../../../shared/errors/AppError.js';
import { FournisseurRepository } from '../repositories/fournisseur.repository.js';
import { EquipementRepository } from '../../equipement/repositories/equipement.repository.js';
import { isValidObjectId } from '../../../infrastructure/database/mongoose.js';
import { createSearchFilter } from '../../../shared/utils/search.util.js';
import { removeUndefinedValues } from '../../../shared/utils/payload.util.js';

export class FournisseurService {
  static listFournisseurs = async (query = {}) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    
    const skip = (page - 1) * limit;
    const searchFilter = createSearchFilter(query.search, ['nom', 'contact','adresse']);

    const filter = {
      ...searchFilter,
      deletedAt: null
    };

    if (query.status === 'active') {
      filter.isActive = true;
    } else if (query.status === 'inactive') {
      filter.isActive = false;
    }

    filter.deletedAt = null;

    const [documents, total] = await FournisseurRepository.getAllFournisseurs({ skip, limit, filter });

    return {
      data: documents,
      meta: { page, limit, total },
    };
  };

  static getFournisseurById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }
    const fournisseur = await FournisseurRepository.getFournisseurById(id);
    if (!fournisseur) {
      throw new NotFoundError(`Fournisseur ${id} non trouvé`);
    }
    return fournisseur;
  };

  static createFournisseur = async (dto) => {
    return FournisseurRepository.createFournisseur(dto);
  };

  static updateFournisseur = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }

    const payload = removeUndefinedValues({
      nom: dto.nom,
      contact: dto.contact,
      adresse: dto.adresse,
    });

    if (Object.keys(payload).length === 0) {
      return FournisseurService.getFournisseurById(id);
    }

    const updated = await FournisseurRepository.updateFournisseur(id, payload);
    if (!updated) {
      throw new NotFoundError(`Fournisseur ${id} non trouvé`);
    }
    return updated;
  };

  static deleteFournisseur = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }
    const fournisseur = await FournisseurRepository.getFournisseurById(id);
    if (!fournisseur) {
      throw new NotFoundError(`Fournisseur ${id} non trouvé`);
    }
    
    const countActive = await EquipementRepository.countActiveByProvider(id);
    if (countActive > 0) {
      throw new ConflictError(
        'Impossible de supprimer ce fournisseur car il possède encore des équipements actifs dans le parc'
      );
    }

    const success = await FournisseurRepository.deleteLogically(id);
    if (!success) {
      throw new NotFoundError(`Fournisseur ${id} non trouvé ou déjà supprimé`);
    }
  };

  static toggleFournisseurStatus = async (id, { isActive }) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }
    const updated = await FournisseurRepository.updateStatus(id, isActive);
    if (!updated) {
      throw new NotFoundError(`Fournisseur ${id} non trouvé`);
    }
    return updated;
  };

  static recalculateMontant = async (fournisseurId) => {
    if (!isValidObjectId(fournisseurId)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }
    const sumResult = await EquipementRepository.sumPricesByProvider(fournisseurId);
    await FournisseurRepository.updateMontant(fournisseurId, sumResult);
  };
}