import { mongoose } from '../../../../../infrastructure/database/mongoose.js';
import { fournisseurSchema } from '../schemas/fournisseur.schema.js';

export const FournisseurModel = mongoose.model('Fournisseur', fournisseurSchema);
