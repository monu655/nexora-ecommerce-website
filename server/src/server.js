import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = app.listen(env.port, () =>
    console.log(`[api] NEXORA API listening on :${env.port} (${env.nodeEnv})`)
  );

  const shutdown = async (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
  process.on('unhandledRejection', (reason) => { console.error('[api] unhandled rejection', reason); });
}

bootstrap().catch((err) => {
  console.error('[api] failed to start', err);
  process.exit(1);
});
