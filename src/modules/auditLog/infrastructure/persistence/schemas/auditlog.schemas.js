import { mongoose } from "../../../../../infrastructure/database/mongoose.js";

export const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,

    },
    url: {
      type: String,
    },
    method: {
      type: String,

    },
    status: {
      type: Number,

    },
    description: {
      type: String,

    },
    duration: {
      type: Number, // en millisecondes

    },
    ip_address: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);