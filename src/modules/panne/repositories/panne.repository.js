import { PanneModel } from "../infrastructure/persistence/models/Panne.model.js";

export class PanneRepository {
  static getAllPannes = async ({ skip, limit, filter = {} }) => {
    const finalFilter = { ...filter, deletedAt: null };
    return Promise.all([
      PanneModel.find(finalFilter)
        .populate("declarant", "nom prenom username tel type")
        .populate({
          path: "equipements.equipement",
          select: "designation type fournisseur prix caracteristique",
          populate: { path: "type", select: "nom" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PanneModel.countDocuments(finalFilter),
    ]);
  };

  static getPanneById = async (id) => {
    const document = await PanneModel.findOne({ _id: id, deletedAt: null })
      .populate("declarant", "nom prenom username tel type")
      .populate({
        path: "equipements.equipement",
        select: "designation type fournisseur prix caracteristique",
        populate: { path: "type", select: "nom" },
      });
    return document ? document : null;
  };

  static createPanne = async (dto) => {
    const document = await PanneModel.create(dto);
    return document.populate([
      { path: "declarant", select: "nom prenom username tel type" },
      {
        path: "equipements.equipement",
        select: "designation type fournisseur prix caracteristique",
      },
    ]);
  };

  static updatePanne = async (id, payload) => {
    const document = await PanneModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      payload,
      { new: true, runValidators: true }
    )
      .populate("declarant", "nom prenom username tel type")
      .populate({
        path: "equipements.equipement",
        select: "designation type fournisseur prix caracteristique",
      });
    return document ? document : null;
  };

  static deleteLogically = async (id) => {
    const result = await PanneModel.updateOne(
      { _id: id, deletedAt: null },
      { isActive: false, deletedAt: new Date() }
    );
    return result.modifiedCount > 0;
  };

  static updateStatut = async (id, statut) => {
    const document = await PanneModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { statut },
      { new: true, runValidators: true }
    )
      .populate("declarant", "nom prenom username tel type")
      .populate({
        path: "equipements.equipement",
        select: "designation type fournisseur prix caracteristique",
      });
    return document ? document : null;
  };
}
