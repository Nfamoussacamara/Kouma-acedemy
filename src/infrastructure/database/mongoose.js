import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export { mongoose };

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
