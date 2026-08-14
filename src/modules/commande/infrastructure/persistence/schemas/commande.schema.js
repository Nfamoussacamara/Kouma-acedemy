import { mongoose } from "../../../../../infrastructure/database/mongoose.js";

export const commandeSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
    },

    fournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fournisseur",
    },

    demandeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    articles: [
      {
        equipement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipement",
        },

        quantiteCommandee: {
          type: Number
        },

        quantiteLivree: {
          type: Number
        },

        prixUnitaire: {
          type: Number
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "EN_ATTENTE",
        "EN_COURS",
        "LIVREE",
        "ANNULEE",
      ],
      default: "EN_ATTENTE",
    },

    prixtotal: {
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
  },
);
