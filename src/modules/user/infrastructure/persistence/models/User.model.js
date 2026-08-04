import { mongoose } from "../../../../../infrastructure/database/mongoose.js";
import { userSchema } from "../schemas/user.schema.js";

export const UserModel = mongoose.model("User", userSchema);
