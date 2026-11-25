import { mongoose } from "../../../../../infrastructure/database/mongoose.js";
import { STATUT_COMMANDE, STATUT_PAIEMENT } from "../../../commande.constance.js";

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

    // Auteur de la création (peut différer du demandeur si un Admin crée pour un User)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Structures sanitaires destinataires (pour commandes créées par l'Admin)
    structure_sanitaire: {
      type: [String],
      default: [],
    },

    creeParAdmin: {
      type: Boolean,
      default: false,
    },

    equipements: [
      {
        equipement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipement",
        },

        // Quantité demandée initialement — immuable après création
        quantiteDemandee: {
          type: Number,
          default: 1,
        },

        // Quantité validée/ajustée par l'Admin lors du passage à "commandee"
        quantiteCommandee: {
          type: Number,
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

    // Bon de commande signé
    bonSigne: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      nomOriginal: { type: String, default: null },
      taille: { type: Number, default: null },
      mimeType: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
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

    // Bon de réception signé
    bonReceptionSigne: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      nomOriginal: { type: String, default: null },
      taille: { type: Number, default: null },
      mimeType: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
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

    status: {
      type: String,
      enum: Object.values(STATUT_COMMANDE),
      default: STATUT_COMMANDE.EN_ATTENTE,
    },

    statusPaiement: {
      type: String,
      enum: Object.values(STATUT_PAIEMENT),
      default: STATUT_PAIEMENT.NON_PAYE,
    },

    paiements: [
      {
        reference: {
          type: String,
        },
        montant: {
          type: Number,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        payePar: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

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