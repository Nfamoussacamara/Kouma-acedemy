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
    modele: {
      type: String,
    },
    prix: {
      type: Number,
      default: 0,
    },
    historique_prix: [
      {
        prix: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        commande: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Commande",
        },
        fournisseur: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Fournisseur",
        },
      },
    ],
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

