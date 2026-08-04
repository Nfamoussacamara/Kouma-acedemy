import { mongoose } from '../../../infrastructure/database/mongoose.js';
import { EquipementModel } from '../infrastructure/persistence/models/Equipement.model.js';

export class EquipementRepository {
  static findAll = async ({ type, fournisseur, skip, limit }) => {
    // Toujours filtrer pour ne renvoyer que les équipements actifs (non supprimés logiquement)
    const filter = { isActive: true };

    if (type) {
      filter.type = type;
    }

    if (fournisseur) {
      filter.fournisseur = fournisseur;
    }

    return Promise.all([
      EquipementModel.find(filter)
        .populate('fournisseur')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      EquipementModel.countDocuments(filter),
    ]);
  };

  static findById = async (id) => {

    const document = await EquipementModel.findOne({ _id: id, isActive: true })
      .populate('fournisseur')
      ;

    return document 
  };

  static create = async (dto) => {
    const document = await EquipementModel.create({
      designation: dto.designation,
      type: dto.type,
      fournisseur: dto.fournisseur,
      caracteristique: dto.caracteristique,
      prix: dto.prix,
      isActive: true,
    });
    // On peuple le fournisseur pour renvoyer un objet complet
    const populated = await document.populate('fournisseur');
    return populated;
  };

  static update = async (id, dto) => {

    const payload = Object.fromEntries(
      Object.entries({
        designation: dto.designation,
        type: dto.type,
        fournisseur: dto.fournisseur,
        caracteristique: dto.caracteristique,
        prix: dto.prix,
      }).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(payload).length === 0) {
      return EquipementRepository.findById(id);
    }

    const document = await EquipementModel.findOneAndUpdate(
      { _id: id, isActive: true },
      payload,
      { returnDocument: 'after' }
    )
      .populate('fournisseur')
      ;

    return document 
  };

  static deleteLogically = async (id) => {

    const result = await EquipementModel.updateOne(
      { _id: id, isActive: true },
      { isActive: false }
    );

    return result.modifiedCount > 0;
  };

  static countActiveByProvider = async (fournisseurId) => {

    return EquipementModel.countDocuments({ fournisseur: fournisseurId, isActive: true });
  };

  static sumPricesByProvider = async (fournisseurId) => {


    const result = await EquipementModel.aggregate([
      {
        $match: {
          fournisseur: new mongoose.Types.ObjectId(fournisseurId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$prix' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  };
}
