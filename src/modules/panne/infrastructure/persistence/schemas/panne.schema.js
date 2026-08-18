import { mongoose } from "../../../../../infrastructure/database/mongoose.js";
import {
  TYPE_PANNE,
  SYSTEMES,
  NIVEAU_URGENCE,
  ALL_IMPACT_SERVICES,
  ALL_TENTATIVES,
  STATUTS_PANNE,
} from "../../../panne.constants.js";

export const panneSchema = new mongoose.Schema(
  {
    description: {
      type: String,
    },

    type_panne: {
      type: String,
      enum: TYPE_PANNE,
    },

    equipements: [
      {
        equipement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipement",
        },
        designation: {
          type: String,
        },
        quantite: {
          type: Number,
        },
        modele: {
          type: String,
        },
      },
    ],
    systeme: {
      type: String,
      enum: SYSTEMES,
    },

    cause: {
      type: String,
      trim: true,
    },

    niveau_urgence: {
      type: String,
      enum: NIVEAU_URGENCE,
      required: true,
    },

    impact_services: [
      {
        type: String,
        enum: ALL_IMPACT_SERVICES,
      },
    ],

    tentatives_realisees: [
      {
        type: String,
        enum: ALL_TENTATIVES,
      },
    ],

    besoin_intervention: {
      type: Boolean,
      default: false,
    },

    declarant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    statut: {
      type: String,
      enum: STATUTS_PANNE,
      default: "NOUVELLE",
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
