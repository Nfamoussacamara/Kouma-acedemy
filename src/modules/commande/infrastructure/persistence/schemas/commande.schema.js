import { mongoose } from "../../../../../infrastructure/database/mongoose.js";

export const commandeSchema = new mongoose.Schema(
  {
    reference: {
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

    equipements: [
      {
        equipement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipement",
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
        reference: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        receptionnePar: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        equipementsRecus: [
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
        facture: {
          nomOriginal: {
            type: String,
            default: null,
          },
          url: {
            type: String,
            default: null,
          },
          publicId: {
            type: String,
            default: null,
          },
          mimeType: {
            type: String,
            default: null,
          },
          taille: {
            type: Number,
            default: null,
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
          uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          deletedAt: {
            type: Date,
            default: null,
          },
          deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
        },
      },
    ],

    status: {
      type: String,
      enum: ["BROUILLON", "EMISE", "PARTIELLEMENT_RECUE", "RECUE", "ANNULEE"],
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
