import { CommandeModel } from '../infrastructure/persistence/models/Commande.model.js';

export class CommandeRepository {
  static getAllCommandes = async ({ skip, limit, filter = {} }) => {
    const finalFilter = { ...filter, deletedAt: null };
    return Promise.all([
      CommandeModel.find(finalFilter)
        .populate('fournisseur')
        .populate('demandeur', 'nom prenom username tel type')
        .populate('panne')
        .populate('equipements.equipement')
        .populate('receptions.receptionnePar', 'nom prenom username tel type')
        .populate('receptions.equipementsRecus.equipement')
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
      .populate('panne')
      .populate('equipements.equipement')
      .populate('receptions.receptionnePar', 'nom prenom username tel type')
      .populate('receptions.equipementsRecus.equipement');
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
      'panne',
      'equipements.equipement',
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
      .populate('panne')
      .populate('equipements.equipement')
      .populate('receptions.receptionnePar', 'nom prenom username tel type')
      .populate('receptions.equipementsRecus.equipement');

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
      .populate('panne')
      .populate('equipements.equipement')
      .populate('receptions.receptionnePar', 'nom prenom username tel type')
      .populate('receptions.equipementsRecus.equipement');

    return document ? document : null;
  };

  static updateReceptionFacture = async (commandeId, receptionId, factureData) => {
    const document = await CommandeModel.findOneAndUpdate(
      { _id: commandeId, 'receptions._id': receptionId, deletedAt: null },
      { $set: { 'receptions.$.facture': factureData } },
      { new: true, runValidators: true },
    )
      .populate('fournisseur')
      .populate('demandeur', 'nom prenom username tel type')
      .populate('panne')
      .populate('equipements.equipement')
      .populate('receptions.receptionnePar', 'nom prenom username tel type')
      .populate('receptions.equipementsRecus.equipement');

    return document ? document : null;
  };

  static getStats = async () => {
    const [
      total,
      brouillon,
      emises,
      partiellementRecues,
      recues,
      annulees,
      montantTotalAggregation,
      dernieresCommandes,
    ] = await Promise.all([
      CommandeModel.countDocuments({ deletedAt: null }),
      CommandeModel.countDocuments({ status: "BROUILLON", deletedAt: null }),
      CommandeModel.countDocuments({ status: "EMISE", deletedAt: null }),
      CommandeModel.countDocuments({ status: "PARTIELLEMENT_RECUE", deletedAt: null }),
      CommandeModel.countDocuments({ status: "RECUE", deletedAt: null }),
      CommandeModel.countDocuments({ status: "ANNULEE", deletedAt: null }),
      CommandeModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: null, total: { $sum: "$prixtotal" } } },
      ]),
      CommandeModel.find({ deletedAt: null })
        .populate('fournisseur', 'nom tel email')
        .populate('demandeur', 'nom prenom username')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      total,
      parStatut: {
        brouillon,
        emises,
        partiellementRecues,
        recues,
        annulees,
      },
      montantTotal: montantTotalAggregation[0]?.total ?? 0,
      dernieresCommandes,
    };
  };
}