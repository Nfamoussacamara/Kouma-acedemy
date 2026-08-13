import {UserModel} from "../../user/infrastructure/persistence/models/User.model.js";
import {EquipementModel} from "../../equipement/infrastructure/persistence/models/Equipement.model.js";
import TypeEquipementModel from "../../type_equipement/infrastructure/models/TypeEquipement.model.js";
import {FournisseurModel} from "../../fournisseur/infrastructure/persistence/models/Fournisseur.model.js";

class DashboardRepository {
  static async getDashboardStats() {


    
    const [
      usersCount,
      equipementsCount,
      typeEquipementsCount,
      fournisseursCount,
      montantTotal
    ] = await Promise.all([
      UserModel.countDocuments({deletedAt: null}),
      EquipementModel.countDocuments({deletedAt: null}),
      TypeEquipementModel.countDocuments({deletedAt: null}),
      FournisseurModel.countDocuments({deletedAt: null}),
      EquipementModel.aggregate([
      {
        $match: { deletedAt: null },
      },
      {
        $group: { _id: null, total: { $sum: "$prix" } },
      }
    ])
    
    ]);
    return {
      usersCount,
      equipementsCount,
      typeEquipementsCount,
      fournisseursCount,
      montantTotal: montantTotal[0]?.total ?? 0,
    };
  }
}

export default DashboardRepository;
