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
  static isTokenBlacklisted = async (token) => {
    if (!token) return false;
    const found = await TokenBlacklistModel.exists({ token });
    return !!found;
  };
}
