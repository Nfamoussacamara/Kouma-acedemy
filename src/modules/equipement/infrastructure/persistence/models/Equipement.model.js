import { mongoose } from '../../../../../infrastructure/database/mongoose.js';
import { equipementSchema } from '../schemas/equipement.schema.js';

export const EquipementModel = mongoose.model('Equipement', equipementSchema);
