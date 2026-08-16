import { NotFoundError, ValidationError } from '../../../shared/errors/AppError.js';
import { EquipementRepository } from '../repositories/equipement.repository.js';
import { EquipementModel } from '../infrastructure/persistence/models/Equipement.model.js';
import { FournisseurRepository } from '../../fournisseur/repositories/fournisseur.repository.js';
import { FournisseurService } from '../../fournisseur/services/fournisseur.service.js';
import { isValidObjectId } from '../../../infrastructure/database/mongoose.js';
import { getPagination } from '../../../shared/utils/pagination.util.js';
import { createSearchFilter } from '../../../shared/utils/search.util.js';
import { removeUndefinedValues } from '../../../shared/utils/payload.util.js';

export class EquipementService {
  static listEquipements = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const searchFilter = createSearchFilter(query.search, ['designation', 'caracteristique']);
    const filter = { ...searchFilter };

    if (query.status === 'active') {
      filter.isActive = true;
    } else if (query.status === 'inactive') {
      filter.isActive = false;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.fournisseur) {
      filter.fournisseur = query.fournisseur;
    }

    filter.deletedAt = null;

    const [documents, total] = await EquipementRepository.getAllEquipement({ 
      skip, 
      limit,
      type: query.type,
      fournisseur: query.fournisseur,
      filter
    });

    return {
      data: documents,
      meta: { page, limit, total },
    };
  };

  static getEquipementById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant équipement invalide");
    }
    const equipement = await EquipementRepository.getEquipementById(id);
    if (!equipement) {
      throw new NotFoundError(`Équipement ${id} non trouvé`);
    }
    return equipement;
  };

  static createEquipement = async (dto) => {
    if (dto.fournisseur) {
      if (!isValidObjectId(dto.fournisseur)) {
        throw new ValidationError("Identifiant fournisseur invalide");
      }
      const fournisseur = await FournisseurRepository.getFournisseurById(dto.fournisseur);
      if (!fournisseur) {
        throw new NotFoundError(`Le fournisseur ${dto.fournisseur} n'existe pas`);
      }
    }

    const equipement = await EquipementRepository.createEquipement(dto);

    if (dto.fournisseur) {
      await FournisseurService.recalculateMontant(dto.fournisseur);
    }

    return equipement;
  };

  static updateEquipement = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant équipement invalide");
    }
    if (dto.fournisseur && !isValidObjectId(dto.fournisseur)) {
      throw new ValidationError("Identifiant fournisseur invalide");
    }

    const equipement = await EquipementRepository.getEquipementById(id);
    if (!equipement) {
      throw new NotFoundError(`Équipement ${id} non trouvé`);
    }

    const oldFournisseurId = equipement.fournisseur?.id;

    if (dto.fournisseur && dto.fournisseur !== oldFournisseurId) {
      const newFournisseur = await FournisseurRepository.getFournisseurById(dto.fournisseur);
      if (!newFournisseur) {
        throw new NotFoundError(`Le nouveau fournisseur ${dto.fournisseur} n'existe pas`);
      }
    }

    const payload = removeUndefinedValues({
      designation: dto.designation,
      type: dto.type,
      fournisseur: dto.fournisseur,
      caracteristique: dto.caracteristique,
      prix: dto.prix,
    });

    const updated = await EquipementRepository.updateEquipement(id, payload);

    if (dto.fournisseur && dto.fournisseur !== oldFournisseurId) {
      if (oldFournisseurId) {
        await FournisseurService.recalculateMontant(oldFournisseurId);
      }
      await FournisseurService.recalculateMontant(dto.fournisseur);
    } else {
      // Recalculer le fournisseur courant s'il n'y a pas eu de changement (ex: modification de prix)
      const currentFournisseurId = dto.fournisseur || oldFournisseurId;
      if (currentFournisseurId) {
        await FournisseurService.recalculateMontant(currentFournisseurId);
      }
    }

    return updated;
  };

  static deleteEquipement = async (id) => {
    if (!isValidObjectId(id)) {
      throw new ValidationError("Identifiant équipement invalide");
    }
    const existing = await EquipementRepository.getEquipementById(id);
    if (!existing) {
      throw new NotFoundError(`Équipement ${id} non trouvé`);
    }

    const fournisseurId = existing.fournisseur?.id;

    const success = await EquipementRepository.deleteLogically(id);
    if (!success) {
      throw new NotFoundError(`Équipement ${id} non trouvé ou déjà supprimé`);
    }

    if (fournisseurId) {
      await FournisseurService.recalculateMontant(fournisseurId);
    }
  };

  static toggleEquipementStatus = async (id, { isActive }) => {
    if(!isValidObjectId(id)){
      throw new ValidationError("Identifiant équipement non valide");
    }

    const existing = await EquipementRepository.getEquipementById(id);
    if (!existing){
      throw new NotFoundError(`Équipement ${id} non trouvé`);
    }

    const updated = await EquipementRepository.updateStatus(id, isActive);
    return updated;
  };

  static enregistrerPrixAchat = async ({ equipementId, nouveauPrix, commandeId, fournisseurId }) => {
    const equipement = await EquipementRepository.getEquipementById(equipementId);
    if (!equipement) return null;

    if (nouveauPrix > 0 && equipement.prix !== nouveauPrix) {
      const entreeHistorique = {
        prix: equipement.prix || 0,
        date: new Date(),
        commande: commandeId,
        fournisseur: fournisseurId,
      };

      await EquipementModel.updateOne(
        { _id: equipementId },
        {
          $set: { prix: nouveauPrix },
          $push: { historique_prix: entreeHistorique },
        }
      );
    }
  };
}
