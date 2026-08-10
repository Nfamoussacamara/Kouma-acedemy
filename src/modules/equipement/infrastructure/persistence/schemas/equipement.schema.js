import { mongoose } from "../../../../../infrastructure/database/mongoose.js";


export const equipementSchema = new mongoose.Schema(
  {
    designation: {
      type: String
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TypeEquipement',
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
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

