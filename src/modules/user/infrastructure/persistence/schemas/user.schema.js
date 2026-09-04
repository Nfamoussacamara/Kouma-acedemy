import { mongoose } from '../../../../../infrastructure/database/mongoose.js';
import { STRUCTURE_SANITAIRE } from '../../../../panne/panne.constants.js';

export const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      select: false,
    },
    nom: {
      type: String,
    },
    prenom: {
      type: String,
    },
    tel: {
      type: String,
    },
    type: {
      type: String,
      enum: ["Admin", "Utilisateur"],
      default: "Utilisateur",
    },

    structure_sanitaire: {
      type: String,
      enum: STRUCTURE_SANITAIRE,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    }
  },
  {
    timestamps: true,
  },
);
