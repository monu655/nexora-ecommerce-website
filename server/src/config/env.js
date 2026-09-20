import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length && process.env.NODE_ENV !== 'test') {
  // Fail fast: a half-configured API is harder to debug than one that refuses to boot.
  console.error(`[config] Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@nexora.store',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Nexora@2025',
    customerEmail: process.env.SEED_CUSTOMER_EMAIL || 'riya.mehta@example.com',
    customerPassword: process.env.SEED_CUSTOMER_PASSWORD || 'Customer@2025',
  },
};
