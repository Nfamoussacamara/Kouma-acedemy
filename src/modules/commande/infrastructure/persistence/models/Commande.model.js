import { mongoose } from '../../../../../infrastructure/database/mongoose.js';
import { commandeSchema } from '../schemas/commande.schema.js';

export const CommandeModel = mongoose.model('Commande', commandeSchema);