import { asyncHandler } from '../../../shared/errors/asyncHandler.js';
import { FactureService } from '../services/facture.service.js';

export class FactureController {
  static upload = asyncHandler(async (req, res) => {
      const commande = await FactureService.uploadFacture({
        commandeId: req.params.commandeId,
        receptionId: req.params.receptionId,
        file: req.file,
        userId: req.user?.id ?? null,
      });
      res.json({
        success: true,
        data: commande,
        message: "Facture enregistrée avec succès" });
  });

  static remove = asyncHandler(async (req, res) => {
      const commande = await FactureService.deleteFacture({
        commandeId: req.params.commandeId,
        receptionId: req.params.receptionId,
        userId: req.user?.id ?? null,
      });
      res.json({
        success: true,
        data: commande,
        message: "Facture supprimée avec succès" });
    });

  static restore = asyncHandler(async (req, res) => {
      const commande = await FactureService.restoreFacture({
        commandeId: req.params.commandeId,
        receptionId: req.params.receptionId,
        userId: req.user?.id ?? null,
      });
      res.json({
        success: true,
        data: commande,
        message: "Facture restaurée avec succès" });
    });
}