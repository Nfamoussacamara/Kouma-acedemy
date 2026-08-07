import mongoose from "../../../../infrastructure/database/mongoose";

const typeEquipementSchema = new mongoose.Schema({
    name: {
        type: String
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true,
    },
 }, {
    timestamps: true,
});     

export default typeEquipementSchema;