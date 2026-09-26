import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  // CORS: lista explícita + (solo desarrollo) localhost/127.0.0.1 en cualquier puerto.
  const allowedOrigins = new Set(env.corsOrigins);
  app.use(
    cors({
      origin: (origin, callback) => {
        const isDevLocal =
          env.nodeEnv === 'development' &&
          /^(?:http|https):\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin ?? '');
        if (!origin || allowedOrigins.has(origin) || isDevLocal) {
          callback(null, true);
          return;
        }
        callback(null, false); // sin cabecera CORS → el navegador lo bloquea
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // Rate limiting básico (protege también la consulta pública anónima).
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Hardening: límites más estrictos en rutas de riesgo (fuerza bruta / scraping).
  const loginLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
  const lookupLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
  // Hardening: fuerza bruta solo sobre login. El refresh se limita con el global,
  // además son llamadas automáticas al recargar el panel (evita bloqueos confusos).
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/loyalty/lookup', lookupLimiter);

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
