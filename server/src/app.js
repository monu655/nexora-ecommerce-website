import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // Render/Vercel sit behind a proxy
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin/server-to-server calls (no Origin header) and the
        // explicitly configured client origins only.
        if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(rateLimit({ windowMs: 60 * 1000, max: 240, standardHeaders: true, legacyHeaders: false }));

  app.get('/', (_req, res) => res.json({ service: 'NEXORA Commerce API', docs: '/api/v1/health' }));
  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
