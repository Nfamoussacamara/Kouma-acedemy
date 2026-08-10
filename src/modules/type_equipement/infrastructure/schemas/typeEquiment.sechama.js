import { mongoose } from "../../../../infrastructure/database/mongoose.js";

const typeEquipementSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    deletedAt: {
        type: Date,
        default: null
    }

  },
  
  {
    timestamps: true,
  },
);

export default typeEquipementSchema;
