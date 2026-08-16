import { UserModel } from "../../user/infrastructure/persistence/models/User.model.js";
import { EquipementModel } from "../../equipement/infrastructure/persistence/models/Equipement.model.js";
import TypeEquipementModel from "../../type_equipement/infrastructure/models/typeEquipement.model.js";
import { FournisseurModel } from "../../fournisseur/infrastructure/persistence/models/Fournisseur.model.js";
import { CommandeModel } from "../../commande/infrastructure/persistence/models/Commande.model.js";

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
    ]);

    return {
      usersCount,
      equipementsCount,
      typeEquipementsCount,
      fournisseursCount,
      montantTotal: montantTotalEquipements[0]?.total ?? 0,
      commandes: {
        total: commandesCount,
        brouillon: commandesBrouillonCount,
        emises: commandesEmisesCount,
        partiellementRecues: commandesPartRecuesCount,
        recues: commandesRecuesCount,
        annulees: commandesAnnuleesCount,
        montantTotal: montantTotalCommandesAggregation[0]?.total ?? 0,
      },
    };
  }
}

export default DashboardRepository;
