import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDatabase() {
  const conn = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
  });
  console.log(`[db] connected → ${conn.connection.host}/${conn.connection.name}`);

  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  mongoose.connection.on('error', (err) => console.error('[db] error', err.message));

  return conn;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}
