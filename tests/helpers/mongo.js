import mongoose from 'mongoose';

export const setupTestDatabase = async () => {
  const uri = 'mongodb://127.0.0.1:27017/kouma_academy_test';
  await mongoose.connect(uri);
};

export const teardownTestDatabase = async () => {
  await mongoose.disconnect();
};

export const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
};
