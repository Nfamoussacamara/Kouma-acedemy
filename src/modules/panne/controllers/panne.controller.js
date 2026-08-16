import { asyncHandler } from "../../../shared/errors/asyncHandler.js";
import { PanneService } from "../services/panne.service.js";

export class PanneController {
  static getOptions = asyncHandler(async (_req, res) => {
    const data = PanneService.getPanneFormOptions();
    res.json({ success: true, data });
  });

  static listPannes = asyncHandler(async (req, res) => {
    const result = await PanneService.listPannes(req.query);
    res.json({ success: true, ...result });
  });

  static getPanneById = asyncHandler(async (req, res) => {
    const data = await PanneService.getPanneById(req.params.id);
    res.json({ success: true, data });
  });

  static createPanne = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.user?._id;
    const data = await PanneService.createPanne(req.body, userId);
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
