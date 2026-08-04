import { mongoose } from '../../../../../infrastructure/database/mongoose.js';

export const equipementSchema = new mongoose.Schema(
  {
    designation: {
      type: String
    },
    type: {
      type: String,

    },
    fournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fournisseur',
    },
    caracteristique: {
      type: String,
    },
    prix: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

