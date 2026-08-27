import { TokenBlacklistModel } from "../infrastructure/persistence/models/TokenBlacklist.model.js";

export class TokenBlacklistRepository {

  static addToken = async ({ token, expiresAt, userId = null, reason = "logout" }) => {
    return TokenBlacklistModel.findOneAndUpdate(
      { token },
      {
        $setOnInsert: {
          token,
          expiresAt,
          userId,
          reason,
        },
      },
      { upsert: true, new: true }
    );
  };
  static getTokenBlacklisted = async (token) => {
    if (!token) return null;
    const found = await TokenBlacklistModel.findOne({ token }).lean();
    return found || null;
  };
}
