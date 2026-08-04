import { mongoose } from "../../../../../infrastructure/database/mongoose.js";

import { auditLogSchema } from "../schemas/auditlog.schemas.js";

export const auditLogModel = mongoose.model("Auditlog", auditLogSchema);