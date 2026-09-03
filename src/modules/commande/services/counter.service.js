import { CommandeModel } from "../infrastructure/persistence/models/Commande.model.js";

export class CounterService {
  static nextCommandeNumber = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const prefix = `CMD-${year}${month}${day}`;

    const latest = await CommandeModel.findOne({
      reference: new RegExp(`^${prefix}-`),
    })
      .sort({ createdAt: -1 })
      .lean();

    let seq = 1;
    if (latest && latest.reference) {
      const parts = latest.reference.split("-");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}-${String(seq).padStart(4, "0")}`;
  };

static nextReceptionNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const prefix = `REC-${year}${month}${day}`;
  const regex = new RegExp(`^${prefix}-`);

  const commandes = await CommandeModel.find({
    "receptions.reference": regex,
  })
    .select("receptions.reference")
    .lean();

  let seq = 1;

  for (const commande of commandes) {
    for (const reception of commande.receptions ?? []) {
      if (!reception.reference || !regex.test(reception.reference)) {
        continue;
      }

      const parts = reception.reference.split("-");
      const lastSeq = Number(parts[parts.length - 1]);

      if (Number.isInteger(lastSeq) && lastSeq >= seq) {
        seq = lastSeq + 1;
      }
    }
  }

  return `${prefix}-${String(seq).padStart(4, "0")}`;
  };
}