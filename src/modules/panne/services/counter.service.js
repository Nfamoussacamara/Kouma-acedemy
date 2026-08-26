import { PanneModel } from "../infrastructure/persistence/models/Panne.model.js";
import { STRUCTURE_SANITAIRE_CODES } from "../panne.constants.js";
import { ValidationError } from "../../../shared/errors/AppError.js";

export const nextPanneReference = async (structureSanitaire) => {
  const code = STRUCTURE_SANITAIRE_CODES[structureSanitaire];

  if (!code) {
    throw new ValidationError(
      `Structure sanitaire inconnue : ${structureSanitaire}`
    );
  }

  const latest = await PanneModel.findOne({
    reference: {
      $regex: `^PA-${code}-`,
    },
  })
    .sort({ reference: -1 })
    .select("reference")
    .lean();

  let sequence = 1;

  if (latest?.reference) {
    const parts = latest.reference.split("-");

    // Le numéro est toujours juste avant JJMM
    const lastSequence = Number(parts[parts.length - 2]);

    if (Number.isInteger(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  const now = new Date();

  const jour = String(now.getDate()).padStart(2, "0");
  const mois = String(now.getMonth() + 1).padStart(2, "0");

  return `PA-${code}-${String(sequence).padStart(4, "0")}-${jour}${mois}`;
};