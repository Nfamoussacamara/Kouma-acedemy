import { FournisseurService } from "../services/fournisseur.service.js";
import { asyncHandler } from "../../../shared/errors/asyncHandler.js";

export class FournisseurController {
  static list = asyncHandler(async (req, res) => {
    const result = await FournisseurService.listFournisseurs(req.query);
    res.json({ success: true, ...result });
  });

  static getById = asyncHandler(async (req, res) => {
    const data = await FournisseurService.getFournisseurById(req.params.id);
    res.json({ success: true, data });
  });

  static create = asyncHandler(async (req, res) => {
    const data = await FournisseurService.createFournisseur(req.body);
    res.status(201).json({ success: true, data });
  });

  static update = asyncHandler(async (req, res) => {
    const data = await FournisseurService.updateFournisseur(
      req.params.id,
      req.body,
    );
    res.json({ success: true, data });
  });

  static delete = asyncHandler(async (req, res) => {
    await FournisseurService.deleteFournisseur(req.params.id);
    res.json({ success: true, message: "Fournisseur supprimé avec succès" });
  });

  static toggleStatus = asyncHandler(async (req, res) => {
    await FournisseurService.toggleFournisseurStatus(req.params.id, req.body);
    res.json({
      success: true,
      message: "Statut du fournisseur mis à jour avec succès",
    });
  });
}
