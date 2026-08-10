import { mongoose } from '../../../../../infrastructure/database/mongoose.js';

export const fournisseurSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
    },
    contact: {
      type: String,
    },
    adresse: {
      type: String,
    },
    montant: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);
