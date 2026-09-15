import { asyncHandler } from '../../../shared/errors/asyncHandler.js';
import { PaiementService } from '../services/paiement.service.js';

export class PaiementController {
  static getPaiementById = asyncHandler(async (req, res) => {
    const data = await PaiementService.getPaiementById(
      req.params.commandeId,
      req.params.paiementId,
    );
    res.json({ success: true, data });
  });

  static createPaiement = asyncHandler(async (req, res) => {
    const data = await PaiementService.createPaiement(
      req.params.commandeId,
      req.body,
      req.user,
    );
    res.status(201).json({
      success: true,
      data,
      message: "Paiement enregistré avec succès",
    });
  });

  static updatePaiement = asyncHandler(async (req, res) => {
    const data = await PaiementService.updatePaiement(
      req.params.commandeId,
      req.params.paiementId,
      req.body,
    );
    res.json({
      success: true,
      data,
      message: "Paiement mis à jour avec succès",
    });
  });

  static deletePaiement = asyncHandler(async (req, res) => {
    const data = await PaiementService.deletePaiement(
      req.params.commandeId,
      req.params.paiementId,
    );
    res.json({
      success: true,
      data,
      message: "Paiement supprimé avec succès",
    });
  });
}
