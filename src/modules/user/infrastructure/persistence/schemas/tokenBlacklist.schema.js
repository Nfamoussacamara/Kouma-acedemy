import { mongoose } from "../../../../../infrastructure/database/mongoose.js";

export const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: "logout",
    },
  },
  {
    timestamps: true,
  }
);

// Index TTL : MongoDB supprime automatiquement le document quand la date expiresAt est atteinte
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
