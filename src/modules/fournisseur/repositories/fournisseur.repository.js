import { FournisseurModel } from '../infrastructure/persistence/models/Fournisseur.model.js';

export class FournisseurRepository {
  static getAllFournisseurs = async ({ skip, limit, filter }) => {
    return Promise.all([
      FournisseurModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FournisseurModel.countDocuments(filter),
    ]);
  };

  static getFournisseurById = async (id) => {

    const document = await FournisseurModel.findOne({ _id: id, deletedAt: null });
    return document ? document : null;
  };

  static createFournisseur = async (dto) => {
    const document = await FournisseurModel.create({
      nom: dto.nom,
      contact: dto.contact,
      adresse: dto.adresse,
      montant: 0, // valeur d'initialisation obligatoire
    });
    return document
  };

  static updateFournisseur = async (id, payload) => {

    const document = await FournisseurModel.findOneAndUpdate({ _id: id, deletedAt: null }, payload, {
      new: true,
      runValidators: true,
    });

    return document ? document : null;
  };

  static updateMontant = async (id, montantValue) => {

    const document = await FournisseurModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { montant: montantValue },
      { new: true }
    );

    return document ? document : null;
  };

  static deleteLogically = async (id) => {
    const result = await FournisseurModel.updateOne(
      { _id: id, isActive: true },
      { isActive: false, deletedAt: new Date() }
    );
    return result.modifiedCount > 0;
  };

  static updateStatus = async (id, isActive) => {
    const result = await FournisseurModel.updateOne(
      { _id: id },
      { isActive }
    );
    return result.modifiedCount > 0;
  };
}
