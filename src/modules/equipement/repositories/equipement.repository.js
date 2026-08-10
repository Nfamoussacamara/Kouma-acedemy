import { mongoose } from "../../../infrastructure/database/mongoose.js";
import { EquipementModel } from "../infrastructure/persistence/models/Equipement.model.js";

export class EquipementRepository {
  static getAllEquipement = async ({ skip, limit, filter = {} }) => {
    return Promise.all([
      EquipementModel.find(filter)
        .populate("fournisseur")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      EquipementModel.countDocuments(filter),
    ]);
  };

  static getEquipementById = async (id) => {
    const document = await EquipementModel.findOne({
      _id: id,
      deletedAt: null,
    }).populate("fournisseur");
    return document;
  };

  static createEquipement = async (dto) => {
    const document = await EquipementModel.create({
      designation: dto.designation,
      type: dto.type,
      fournisseur: dto.fournisseur,
      caracteristique: dto.caracteristique,
      prix: dto.prix,
      isActive: true,
    });
    // On peuple le fournisseur pour renvoyer un objet complet
    const populated = await document.populate("fournisseur");
    return populated;
  };

  static updateEquipement = async (id, payload) => {
    if (Object.keys(payload).length === 0) {
      return EquipementRepository.getEquipementById(id);
    }

    const document = await EquipementModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      payload,
      { returnDocument: "after" },
    ).populate("fournisseur");
    return document;
  };

  static deleteLogically = async (id) => {
    const result = await EquipementModel.updateOne(
      { _id: id, deletedAt: null },
      { isActive: false, deletedAt: new Date() },
    );

    return result.modifiedCount > 0;
  };

  static countActiveByProvider = async (fournisseurId) => {
    return EquipementModel.countDocuments({
      fournisseur: fournisseurId,
      isActive: true,
      deletedAt: null,
    });
  };

  static sumPricesByProvider = async (fournisseurId) => {
    const result = await EquipementModel.aggregate([
      {
        $match: {
          fournisseur: new mongoose.Types.ObjectId(fournisseurId),
          isActive: true,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$prix" },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  };

  static updateStatus = async (id, isActive) => {
    const result = await EquipementModel.updateOne({ _id: id }, { isActive });
    return result.modifiedCount > 0;
  };
}
