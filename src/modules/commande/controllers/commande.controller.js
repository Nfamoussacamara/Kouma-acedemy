import { asyncHandler } from '../../../shared/errors/asyncHandler.js';
import { CommandeService } from '../services/commande.service.js';

export class CommandeController {
  static listCommandes = asyncHandler(async (req, res) => {
    const result = await CommandeService.listCommandes(req.query);
    res.json({ success: true, ...result });
  });

  static getCommandeById = asyncHandler(async (req, res) => {
    const data = await CommandeService.getCommandeById(req.params.id);
    res.json({ success: true, data });
  });

  static createCommande = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.user?._id;
    const data = await CommandeService.createCommande(req.body, userId);
    res.status(201).json({ success: true, data });
  });

  static updateCommande = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.user?._id;
    const data = await CommandeService.updateCommande(req.params.id, req.body, userId);
    res.json({ success: true, data });
  });


  static receptionnerCommande = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.user?._id;
    const data = await CommandeService.receptionnerCommande(req.params.id, req.body, userId);
    res.json({
      success: true,
      data,
      message: "Réception enregistrée avec succès",
    });
  });

  static deleteCommande = asyncHandler(async (req, res) => {
    await CommandeService.deleteCommande(req.params.id);
    res.json({ success: true, message: "Commande supprimée avec succès" });
  });

  static toggleCommandeStatus = asyncHandler(async (req, res) => {
    const data = await CommandeService.toggleCommandeStatus(req.params.id, req.body);
    res.json({
      success: true,
      data,
      message: "Statut de la commande mis à jour avec succès",
    });
  });
}