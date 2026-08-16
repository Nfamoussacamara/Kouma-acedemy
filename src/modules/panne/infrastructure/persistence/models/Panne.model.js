import { mongoose } from "../../../../../infrastructure/database/mongoose.js";
import { panneSchema } from "../schemas/panne.schema.js";

export const PanneModel = mongoose.model("Panne", panneSchema);
