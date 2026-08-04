import { FournisseurModel } from '../infrastructure/persistence/models/Fournisseur.model.js';

export class FournisseurRepository {
  static findAll = async ({ skip, limit }) => {
    return Promise.all([
      FournisseurModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        ,
      FournisseurModel.countDocuments(),
    ]);
  };

  static findById = async (id) => {

    const document = await FournisseurModel.findById(id);
    return document ? document : null;
  };

  static create = async (dto) => {
    const document = await FournisseurModel.create({
      nom: dto.nom,
      contact: dto.contact,
      adresse: dto.adresse,
      montant: 0, // valeur d'initialisation obligatoire
    });
    return document
  };

  static update = async (id, payload) => {

    const document = await FournisseurModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    return document ? document : null;
  };

  static updateMontant = async (id, montantValue) => {

    const document = await FournisseurModel.findByIdAndUpdate(
      id,
      { montant: montantValue },
      { new: true }
    );

    return document ? document : null;
  };

  static delete = async (id) => {

    const result = await FournisseurModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  };
}
