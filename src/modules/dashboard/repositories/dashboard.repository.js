import { CommandeModel } from "../../commande/infrastructure/persistence/models/Commande.model.js";
import { PanneModel } from "../../panne/infrastructure/persistence/models/Panne.model.js";

class DashboardRepository {
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
