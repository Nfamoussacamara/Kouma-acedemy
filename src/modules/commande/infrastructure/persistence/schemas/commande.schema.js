import { mongoose } from "../../../../../infrastructure/database/mongoose.js";

export const commandeSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
    },

    panne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Panne",
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

        typeEquipement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TypeEquipement",
        },

        designation: {
          type: String,
        },

        quantiteCommandee: {
          type: Number,
          required: true,
          default: 1,
        },

        quantiteRecue: {
          type: Number,
          default: 0,
        },

        prixUnitaire: {
          type: Number,
          default: 0,
        },
      },
    ],

    receptions: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        receptionnePar: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        articlesRecus: [
          {
            equipement: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Equipement",
            },
            quantiteRecue: {
              type: Number,
              required: true,
            },
            prixUnitaire: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],

    status: {
      type: String,
      enum: [
        "BROUILLON",
        "EMISE",
        "PARTIELLEMENT_RECUE",
        "RECUE",
        "ANNULEE",
      ],
      default: "BROUILLON",
    },

    prixtotal: {
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
    },
  },
  {
    timestamps: true,
  },
);
