import { UserService } from "../../user/services/user.service.js";
import { EquipementService } from "../../equipement/services/equipement.service.js";
import { TypeEquipementService } from "../../type_equipement/services/typeEquipement.service.js";
import { FournisseurService } from "../../fournisseur/services/fournisseur.service.js";
import { CommandeService } from "../../commande/services/commande.service.js";
import { PanneService } from "../../panne/services/panne.service.js";
import DashboardRepository from "../repositories/dashboard.repository.js";

export default class DashboardService {
  static async getDashboardStats() {
    const [
      userStats,
      equipementStats,
      typeEquipementStats,
      fournisseurStats,
      commandeStats,
      panneStats,
      repartitionParStructure,
      dernieresPannes,
    ] = await Promise.all([
      UserService.getStats(),
      EquipementService.getStats(),
      TypeEquipementService.getStats(),
      FournisseurService.getStats(),
      CommandeService.getStats(),
      PanneService.getStats(),
      PanneService.getStatsByStructure(),
      PanneService.getLatestPannes(5),
    ]);

    return {
      usersCount: userStats.total,
      equipementsCount: equipementStats.total,
      typeEquipementsCount: typeEquipementStats.total,
      fournisseursCount: fournisseurStats.total,
      montantTotal: equipementStats.montantTotal,
      equipementsEnPanne: equipementStats.equipementsEnPanne,
      commandes: {
        total: commandeStats.total,
        brouillon: commandeStats.parStatut.brouillon,
        emises: commandeStats.parStatut.emises,
        partiellementRecues: commandeStats.parStatut.partiellementRecues,
        recues: commandeStats.parStatut.recues,
        annulees: commandeStats.parStatut.annulees,
        montantTotal: commandeStats.montantTotal,
      },
      pannes: {
        total: panneStats.total,
        nouvelles: panneStats.nouvelles,
        enCours: panneStats.enCours,
        resolues: panneStats.resolues,
        cloturees: panneStats.cloturees,
        critiques: panneStats.critiques,
        besoinIntervention: panneStats.besoinIntervention,
        repartitionParStructure,
        dernieresPannes,
      },
    };
  }

  static async getMonthlyCharts(year) {
    return DashboardRepository.getMonthlyCharts(year);
  }
}
