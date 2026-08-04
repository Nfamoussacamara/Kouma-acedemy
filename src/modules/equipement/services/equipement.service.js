import { NotFoundError } from '../../../shared/errors/AppError.js';
import { EquipementRepository } from '../repositories/equipement.repository.js';
import { FournisseurRepository } from '../../fournisseur/repositories/fournisseur.repository.js';
import { FournisseurService } from '../../fournisseur/services/fournisseur.service.js';
import { isValidObjectId } from '../../../infrastructure/database/mongoose.js';

export class EquipementService {
  static listEquipements = async (query = {}) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    
    const skip = (page - 1) * limit;

    const [documents, total] = await EquipementRepository.findAll({ 
      skip, 
      limit,
      type: query.type,
      fournisseur: query.fournisseur,
    });

    return {
      data: documents,
      meta: { page, limit, total },
    };
  };

  static getEquipementById = async (id) => {
    if (!isValidObjectId(id)) {
      throw new Error("Identifiant équipement invalide");
    }
    const equipement = await EquipementRepository.findById(id);
    if (!equipement) {
      throw new NotFoundError(`Équipement ${id} non trouvé`);
    }
    return equipement;
  };

  static createEquipement = async (dto) => {
    if (dto.fournisseur && !isValidObjectId(dto.fournisseur)) {
      throw new Error("Identifiant fournisseur invalide");
    }
    // 1. Vérifier si le fournisseur associé existe
    const fournisseur = await FournisseurRepository.findById(dto.fournisseur);
    if (!fournisseur) {
      throw new NotFoundError(`Le fournisseur ${dto.fournisseur} n'existe pas`);
    }

    // 2. Créer l'équipement
    const equipement = await EquipementRepository.create(dto);

    // 3. Déclencher le recalcul automatique du montant du fournisseur
    await FournisseurService.recalculateMontant(dto.fournisseur);

    return equipement;
  };

  static updateEquipement = async (id, dto) => {
    if (!isValidObjectId(id)) {
      throw new Error("Identifiant équipement invalide");
    }
    if (dto.fournisseur && !isValidObjectId(dto.fournisseur)) {
      throw new Error("Identifiant fournisseur invalide");
    }
    // 1. Récupérer l'équipement existant
    const existing = await EquipementRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Équipement ${id} non trouvé`);
    }

    // On extrait l'ID brut du fournisseur lié initialement
    const oldFournisseurId = existing.fournisseur?.id;

    // 2. Si le fournisseur est modifié, vérifier qu'il existe
    if (dto.fournisseur && dto.fournisseur !== oldFournisseurId) {
      const newFournisseur = await FournisseurRepository.findById(dto.fournisseur);
      if (!newFournisseur) {
        throw new NotFoundError(`Le nouveau fournisseur ${dto.fournisseur} n'existe pas`);
      }
    }

    // 3. Mettre à jour l'équipement
    const updated = await EquipementRepository.update(id, dto);

    // 4. Recalculer le montant fournisseur
    if (dto.fournisseur && dto.fournisseur !== oldFournisseurId) {
      // Recalculer pour l'ancien ET le nouveau fournisseur si transfert
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
      throw new Error("Identifiant équipement invalide");
    }
    // 1. Récupérer l'équipement existant
    const existing = await EquipementRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Équipement ${id} non trouvé`);
    }

    const fournisseurId = existing.fournisseur?.id;

    // 2. Supprimer logiquement (isActive: false)
    const success = await EquipementRepository.deleteLogically(id);
    if (!success) {
      throw new NotFoundError(`Équipement ${id} non trouvé ou déjà supprimé`);
    }

    // 3. Recalculer le montant de son fournisseur
    if (fournisseurId) {
      await FournisseurService.recalculateMontant(fournisseurId);
    }
  };
}
