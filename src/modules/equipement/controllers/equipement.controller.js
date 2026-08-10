import { EquipementService } from '../services/equipement.service.js';
import { asyncHandler } from '../../../shared/errors/asyncHandler.js';

export class EquipementController {
  static list = asyncHandler(async (req, res) => {
    const result = await EquipementService.listEquipements(req.query);
    res.json({ success: true, ...result });
  });

  static getById = asyncHandler(async (req, res) => {
    const data = await EquipementService.getEquipementById(req.params.id);
    res.json({ success: true, data });
  });

  static create = asyncHandler(async (req, res) => {
    const data = await EquipementService.createEquipement(req.body);
    res.status(201).json({ success: true, data });
  });

  static update = asyncHandler( async (req, res) => {
    const data = await EquipementService.updateEquipement(req.params.id, req.body);
    res.json({ success: true, data });
  });


  static toggleStatus = asyncHandler(async (req, res) => {
    await EquipementService.toggleEquipementStatus(req.params.id, req.body);
    res.json({ success: true, message: "Statut de l'équipement mis à jour avec succès" });
  });

  static delete = asyncHandler(async (req, res) => {
    await EquipementService.deleteEquipement(req.params.id);
    res.status(204).send();
  });
}
