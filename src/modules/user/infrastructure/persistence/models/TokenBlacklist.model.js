import { mongoose } from "../../../../../infrastructure/database/mongoose.js";
import { tokenBlacklistSchema } from "../schemas/tokenBlacklist.schema.js";

export const TokenBlacklistModel = mongoose.model(
  "TokenBlacklist",
  tokenBlacklistSchema
);
