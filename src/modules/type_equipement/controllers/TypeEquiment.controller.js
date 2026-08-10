import { TypeEquipementService } from "../services/typeEquipement.service.js";
import { asyncHandler } from "../../../shared/errors/asyncHandler.js";
import sendSuccess from "../../../shared/utils/sendsucces.js";

export class TypeEquipementController {
    static listTypeEquipements = asyncHandler(async (req, res, next) => {
        const result = await TypeEquipementService.listTypeEquipements(req.query);
        return sendSuccess(res, result, "Types d'equipements listés avec succès");
    });

    static getTypeEquipementById = asyncHandler(async (req, res, next) => {
        const result = await TypeEquipementService.getTypeEquipementById(req.params.id);
        return sendSuccess(res, result, "Type d'equipement trouvé avec succès");
    });

    static createTypeEquipement = asyncHandler(async (req, res, next) => {
        const result = await TypeEquipementService.createTypeEquipement(req.body);
        return sendSuccess(res, {data : result}, "Type d'equipement créé avec succès");
    });

    static updateTypeEquipement = asyncHandler(async (req, res, next) => {
        const result = await TypeEquipementService.updateTypeEquipement(req.params.id, req.body);
        return sendSuccess(res, result, "Type d'equipement mis à jour avec succès");
    });

    static deleteTypeEquipement = asyncHandler(async (req, res, next) => {
        const result = await TypeEquipementService.deleteTypeEquipement(req.params.id);
        return sendSuccess(res,{},"Type d'equipement supprimé avec succès");
    });

    static toggleStatus = asyncHandler(async (req, res, next) => {
        const result = await TypeEquipementService.toggleTypeEquipementStatus(req.params.id, req.body);
        return sendSuccess(res, result, "Statut du type d'equipement mis à jour avec succès");
    });
}