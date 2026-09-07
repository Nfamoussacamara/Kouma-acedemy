import { UserModel } from "../../user/infrastructure/persistence/models/User.model.js";
import { EquipementModel } from "../../equipement/infrastructure/persistence/models/Equipement.model.js";
import TypeEquipementModel from "../../type_equipement/infrastructure/models/typeEquipement.model.js";
import { FournisseurModel } from "../../fournisseur/infrastructure/persistence/models/Fournisseur.model.js";
import { CommandeModel } from "../../commande/infrastructure/persistence/models/Commande.model.js";
import { PanneModel } from "../../panne/infrastructure/persistence/models/Panne.model.js";

class DashboardRepository {
  static async getDashboardStats() {
    const [
      usersCount,
      equipementsCount,
      typeEquipementsCount,
      fournisseursCount,
      montantTotalEquipements,
      commandesCount,
      commandesBrouillonCount,
      commandesEmisesCount,
      commandesPartRecuesCount,
      commandesRecuesCount,
      commandesAnnuleesCount,
      montantTotalCommandesAggregation,
      pannesTotal,
      pannesNouvelles,
      pannesEnCours,
      pannesResolues,
      pannesCloturees,
      pannesCritiques,
      pannesBesoinIntervention,
      equipementsEnPanneAgg,
      pannesParStructure,
      dernieresPannes,
    ] = await Promise.all([
      UserModel.countDocuments({ deletedAt: null }),
      EquipementModel.countDocuments({ deletedAt: null }),
      TypeEquipementModel.countDocuments({ deletedAt: null }),
      FournisseurModel.countDocuments({ deletedAt: null }),
      EquipementModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: null, total: { $sum: "$prix" } } },
      ]),
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

      PanneModel.countDocuments({ deletedAt: null }),
      PanneModel.countDocuments({ deletedAt: null, statut: "NOUVELLE" }),
      PanneModel.countDocuments({ deletedAt: null, statut: "EN_COURS" }),
      PanneModel.countDocuments({ deletedAt: null, statut: "RESOLUE" }),
      PanneModel.countDocuments({ deletedAt: null, statut: "CLOTUREE" }),
      PanneModel.countDocuments({ deletedAt: null, niveau_urgence: "Critique" }),
      PanneModel.countDocuments({ deletedAt: null, besoin_intervention: true }),
      PanneModel.aggregate([
        {
          $match: {
            deletedAt: null,
            statut: { $in: ["NOUVELLE", "EN_COURS"] },
            "equipements.0": { $exists: true },
          },
        },
        { $unwind: "$equipements" },
        {
          $match: {
            "equipements.equipement": { $ne: null },
          },
        },
        { $group: { _id: "$equipements.equipement" } },
        { $count: "count" },
      ]),
      PanneModel.aggregate([
        { $match: { deletedAt: null, structure_sanitaire: { $ne: null } } },
        { $group: { _id: "$structure_sanitaire", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      PanneModel.find({ deletedAt: null })
        .populate("declarant", "username nom prenom tel structure_sanitaire")
        .select("reference structure_sanitaire description type_panne niveau_urgence statut besoin_intervention createdAt declarant")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      usersCount,
      equipementsCount,
      typeEquipementsCount,
      fournisseursCount,
      montantTotal: montantTotalEquipements[0]?.total ?? 0,
      equipementsEnPanne: equipementsEnPanneAgg[0]?.count ?? 0,
      commandes: {
        total: commandesCount,
        brouillon: commandesBrouillonCount,
        emises: commandesEmisesCount,
        partiellementRecues: commandesPartRecuesCount,
        recues: commandesRecuesCount,
        annulees: commandesAnnuleesCount,
        montantTotal: montantTotalCommandesAggregation[0]?.total ?? 0,
      },
      pannes: {
        total: pannesTotal,
        nouvelles: pannesNouvelles,
        enCours: pannesEnCours,
        resolues: pannesResolues,
        cloturees: pannesCloturees,
        critiques: pannesCritiques,
        besoinIntervention: pannesBesoinIntervention,
        repartitionParStructure: pannesParStructure.map((item) => ({
          structure: item._id,
          total: item.count,
        })),
        dernieresPannes,
      },
    };
  }

  static async getMyStats(userId) {
    const [
      totalPannes,
      pannesNouvelles,
      pannesCritiques,
      pannesEnCours,
      pannesResolues,
      pannesCloturees,
      besoinIntervention,
      dernieresPannes,
    ] = await Promise.all([
      PanneModel.countDocuments({ deletedAt: null, declarant: userId }),
      PanneModel.countDocuments({ deletedAt: null, declarant: userId, statut: "NOUVELLE" }),
      PanneModel.countDocuments({ deletedAt: null, declarant: userId, niveau_urgence: "Critique" }),
      PanneModel.countDocuments({ deletedAt: null, declarant: userId, statut: "EN_COURS" }),
      PanneModel.countDocuments({ deletedAt: null, declarant: userId, statut: "RESOLUE" }),
      PanneModel.countDocuments({ deletedAt: null, declarant: userId, statut: "CLOTUREE" }),
      PanneModel.countDocuments({ deletedAt: null, declarant: userId, besoin_intervention: true }),
      PanneModel.find({ deletedAt: null, declarant: userId })
        .select("reference structure_sanitaire description type_panne niveau_urgence statut besoin_intervention createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      totalPannes,
      pannesNouvelles,
      pannesCritiques,
      pannesEnCours,
      pannesResolues,
      pannesCloturees,
      besoinIntervention,
      dernieresPannes,
    };
  }

  static async getMonthlyCharts(year) {
    const currentYear = new Date().getFullYear();
    const validYear = (typeof year === 'number' && !isNaN(year) && year >= 2000) ? year : currentYear;
    const startDate = new Date(`${validYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${validYear + 1}-01-01T00:00:00.000Z`);

    const [pannesMonthly, commandesMonthly] = await Promise.all([
      PanneModel.aggregate([
        {
          $match: {
            deletedAt: null,
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: 1 },
            resolues: {
              $sum: {
                $cond: [{ $in: ["$statut", ["RESOLUE", "CLOTUREE"]] }, 1, 0],
              },
            },
          },
        },
        { $sort: { "_id": 1 } },
      ]),

      CommandeModel.aggregate([
        {
          $match: {
            deletedAt: null,
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            totalCommandes: { $sum: 1 },
            montantTotal: { $sum: "$prixtotal" },
          },
        },
        { $sort: { "_id": 1 } },
      ]),
    ]);

    const pannesMap = new Map(pannesMonthly.map((item) => [item._id, item]));
    const commandesMap = new Map(commandesMonthly.map((item) => [item._id, item]));

    const moisNoms = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    const moisData = moisNoms.map((nom, index) => {
      const moisNum = index + 1;
      const panneItem = pannesMap.get(moisNum);
      const commandeItem = commandesMap.get(moisNum);

      return {
        mois: nom,
        moisNumero: moisNum,
        pannes: {
          total: panneItem?.total ?? 0,
          resolues: panneItem?.resolues ?? 0,
        },
        commandes: {
          total: commandeItem?.totalCommandes ?? 0,
          montantTotal: commandeItem?.montantTotal ?? 0,
        },
      };
    });

    return {
      annee: year,
      mois: moisData,
    };
  }
}
export default DashboardRepository;
