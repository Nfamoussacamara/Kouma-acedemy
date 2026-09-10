import { asyncHandler } from "../../../shared/errors/asyncHandler.js";
import { PanneService } from "../services/panne.service.js";

export class PanneController {
  static listPannes = asyncHandler(async (req, res) => {
    const CurrentUser = req.user
    const result = await PanneService.listPannes(req.query, CurrentUser);
    res.json({ success: true, ...result });
  });

  static getStats = asyncHandler(async (req, res) => {
    const data = await PanneService.getStats(req.user);
    res.json({ success: true, data });
  });

  static getPanneById = asyncHandler(async (req, res) => {
    const data = await PanneService.getPanneById(req.params.id);
    res.json({ success: true, data });
  });

  static createPanne = asyncHandler(async (req, res) => {
    const user = req.user;
    const data = await PanneService.createPanne(req.body, user);
    res.status(201).json({ success: true, data });
  });

  static updatePanne = asyncHandler(async (req, res) => {
    const data = await PanneService.updatePanne(req.params.id, req.body);
    res.json({ success: true, data });
  });

  static toggleStatut = asyncHandler(async (req, res) => {
    const data = await PanneService.toggleStatut(req.params.id, req.body);
    res.json({
      success: true,
      data,
      message: "Statut de la panne mis à jour avec succès",
    });
  });

  static deletePanne = asyncHandler(async (req, res) => {
    await PanneService.deletePanne(req.params.id);
    res.json({ success: true, message: "Panne supprimée avec succès" });
  });
}
