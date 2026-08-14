import { CommandeModel } from '../infrastructure/persistence/models/Commande.model.js';

export class CommandeRepository {
  static getAllCommandes = async ({ skip, limit, filter = {} }) => {
    const finalFilter = { ...filter, deletedAt: null };
    return Promise.all([
      CommandeModel.find(finalFilter)
        .populate('fournisseur')
        .populate('demandeur', 'nom prenom username tel type')
        .populate('articles.equipement')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommandeModel.countDocuments(finalFilter),
    ]);
  };

  static getCommandeById = async (id) => {
    const document = await CommandeModel.findOne({ _id: id, deletedAt: null })
      .populate('fournisseur')
      .populate('demandeur', 'nom prenom username tel type')
      .populate('articles.equipement');
    return document ? document : null;
  };

  static getCommandesByIds = async (ids) => {
    return CommandeModel.find({ _id: { $in: ids }, deletedAt: null });
  };

  static createCommande = async (dto) => {
    const document = await CommandeModel.create(dto);
    return document.populate([
      'fournisseur',
      { path: 'demandeur', select: 'nom prenom username tel type' },
      'articles.equipement',
    ]);
  };

  static updateCommande = async (id, payload) => {
    const document = await CommandeModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      payload,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('fournisseur')
      .populate('demandeur', 'nom prenom username tel type')
      .populate('articles.equipement');

    return document ? document : null;
  };

  static deleteLogically = async (id) => {
    const result = await CommandeModel.updateOne(
      { _id: id, deletedAt: null },
      { isActive: false, deletedAt: new Date() },
    );

    return result.modifiedCount > 0;
  };

  static updateStatus = async (id, status) => {
    const document = await CommandeModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { status },
      { new: true, runValidators: true },
    )
      .populate('fournisseur')
      .populate('demandeur', 'nom prenom username tel type')
      .populate('articles.equipement');

    return document ? document : null;
  };
}