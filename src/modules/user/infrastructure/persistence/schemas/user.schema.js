import { mongoose } from '../../../../../infrastructure/database/mongoose.js';

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
      default: 'Utilisateur',
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
