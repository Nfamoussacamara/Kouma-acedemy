import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 3000,
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  mongodbUri:
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/kouma_academy',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  cloudinaryName: process.env.CLOUDINARY_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  swaggerUsername: process.env.SWAGGER_USERNAME ,
  swaggerPassword: process.env.SWAGGER_PASSWORD,
};

export default config;