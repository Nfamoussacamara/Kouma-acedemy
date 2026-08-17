import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

export const setupTestDatabase = async () => {
  // --- Configuration pour base de données locale (décommenter plus tard si besoin) ---
  // const uri = 'mongodb://127.0.0.1:27017/kouma_academy_test';
  // await mongoose.connect(uri);

  // --- Configuration MongoDB en mémoire pour les tests ---
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

export const teardownTestDatabase = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

export const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
};

