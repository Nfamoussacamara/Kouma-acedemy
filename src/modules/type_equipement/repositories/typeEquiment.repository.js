import typeEquipementModel from "../infrastructure/models/typeEquipement.model.js";

export default class typeEquipementRepository {
  static getAllTypeEquipements = async ({ skip, limit, filter }) => {
    return Promise.all([
      typeEquipementModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      typeEquipementModel.countDocuments(filter),
    ]);
  };

  static createTypeEquipement = async (payload) => {
    const equipement = await typeEquipementModel.create(payload);
    return equipement;
  };

  static getTypeEquipementById = async (id) => {
    const equipement = await typeEquipementModel.findOne({ _id: id, deletedAt: null });
    return equipement ? equipement : null;
  };

  static updateTypeEquipement = async (id, payload) => {
    const equipement = await typeEquipementModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      payload,
      { new: true },
    );
    return equipement ? equipement : null;
  };

  static deleteLogically = async (id) => {
    const result = await typeEquipementModel.updateOne(
      { _id: id, deletedAt: null },
      { isActive: false , deletedAt : new Date()},
    );

    return result.modifiedCount > 0; 
  };

  static updateStatus = async (id, { isActive }) => {
    const result = await typeEquipementModel.updateOne(
      { _id: id },
      { isActive },
    );

    return result.modifiedCount > 0;
  };
}
