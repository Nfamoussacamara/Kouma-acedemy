import { CommandeModel } from "../infrastructure/persistence/models/Commande.model.js";

export class CounterService {
  static nextCommandeNumber = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const prefix = `CMD-${year}${month}${day}`;

    // Trouver la dernière commande générée aujourd'hui
    const latest = await CommandeModel.findOne({
      numero: new RegExp(`^${prefix}-`),
    })
      .sort({ createdAt: -1 })
      .lean();

    let seq = 1;
    if (latest && latest.numero) {
      const parts = latest.numero.split("-");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}-${String(seq).padStart(4, "0")}`;
  };
}
