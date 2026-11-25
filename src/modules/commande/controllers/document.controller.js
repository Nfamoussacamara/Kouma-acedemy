import { asyncHandler } from '../../../shared/errors/asyncHandler.js';
import { DocumentService } from '../services/document.service.js';

export class DocumentController {
  /* ──────────────────────────────────────────────────────────────────────────
   *  BON DE COMMANDE SIGNÉ
   * ────────────────────────────────────────────────────────────────────────── */

  static uploadBonSigne = asyncHandler(async (req, res) => {
    const data = await DocumentService.uploadBonSigne({
      commandeId: req.params.id,
      file: req.file,
      user: req.user,
    });
    res.json({
      success: true,
      data,
      message: 'Bon de commande signé enregistré avec succès',
    });
  });

  static deleteBonSigne = asyncHandler(async (req, res) => {
    const data = await DocumentService.deleteBonSigne({
      commandeId: req.params.id,
      user: req.user,
    });
    res.json({
      success: true,
      data,
      message: 'Bon de commande signé supprimé avec succès',
    });
  });

  static restoreBonSigne = asyncHandler(async (req, res) => {
    const data = await DocumentService.restoreBonSigne({
      commandeId: req.params.id,
      user: req.user,
    });
    res.json({
      success: true,
      data,
      message: 'Bon de commande signé restauré avec succès',
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
   *  BON DE RÉCEPTION SIGNÉ
   * ────────────────────────────────────────────────────────────────────────── */

  static uploadBonReceptionSigne = asyncHandler(async (req, res) => {
    const data = await DocumentService.uploadBonReceptionSigne({
      commandeId: req.params.id,
      file: req.file,
      user: req.user,
    });
    res.json({
      success: true,
      data,
      message: 'Bon de réception signé enregistré avec succès',
    });
  });

  static deleteBonReceptionSigne = asyncHandler(async (req, res) => {
    const data = await DocumentService.deleteBonReceptionSigne({
      commandeId: req.params.id,
      user: req.user,
    });
    res.json({
      success: true,
      data,
      message: 'Bon de réception signé supprimé avec succès',
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
   *  FACTURES DE RÉCEPTION
   * ────────────────────────────────────────────────────────────────────────── */

  static uploadFacture = asyncHandler(async (req, res) => {
    const commande = await DocumentService.uploadFacture({
      commandeId: req.params.commandeId,
      receptionId: req.params.receptionId,
      file: req.file,
      userId: req.user?.id ?? null,
    });
    res.json({
      success: true,
      data: commande,
      message: 'Facture enregistrée avec succès',
    });
  });

  static removeFacture = asyncHandler(async (req, res) => {
    const commande = await DocumentService.deleteFacture({
      commandeId: req.params.commandeId,
      receptionId: req.params.receptionId,
      userId: req.user?.id ?? null,
    });
    res.json({
      success: true,
      data: commande,
      message: 'Facture supprimée avec succès',
    });
  });

  static restoreFacture = asyncHandler(async (req, res) => {
    const commande = await DocumentService.restoreFacture({
      commandeId: req.params.commandeId,
      receptionId: req.params.receptionId,
      userId: req.user?.id ?? null,
    });
    res.json({
      success: true,
      data: commande,
      message: 'Facture restaurée avec succès',
    });
  });
}
