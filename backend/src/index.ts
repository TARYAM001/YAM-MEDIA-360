import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { testConnection } from './config/database';
import authRoutes    from './routes/auth';
import newsRoutes    from './routes/news';
import collectRoutes from './routes/collect';
import statsRoutes   from './routes/stats';
import chatbotRoutes from './routes/chatbot';
import instagramRoutes from './routes/instagram';
import { startScheduler } from './services/scheduler';

dotenv.config();

// ── Validation des variables critiques au démarrage ───────────
function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('❌ Variables manquantes:', missing.join(', '));
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
    console.error('❌ CORS_ORIGIN obligatoire en production');
    process.exit(1);
  }
  if (process.env.JWT_SECRET === 'change_this_in_production') {
    console.error('❌ JWT_SECRET par défaut détecté — changez-le avant de déployer !');
    process.exit(1);
  }
}

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Rate limiters spécifiques ─────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 min' },
});
const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Limite chatbot atteinte (20 messages / 15 min)' },
});

// ── Sécurité HTTP ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Routes ────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', app: 'YAM Media API', timestamp: new Date().toISOString() })
);

app.use('/api/auth',    authLimiter,    authRoutes);
app.use('/api/news',                    newsRoutes);
app.use('/api/collect',                 collectRoutes);
app.use('/api/stats',                   statsRoutes);
app.use('/api/instagram',               instagramRoutes);
app.use('/api/chatbot', chatbotLimiter, chatbotRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route non trouvée' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ── Démarrage ─────────────────────────────────────────────────
async function start() {
  const skipEnv = process.env.SKIP_ENV_VALIDATION === 'true' || process.env.SKIP_ENV_VALIDATION === '1';
  const skipDb = process.env.SKIP_DB === 'true' || process.env.SKIP_DB === '1';

  if (!skipEnv) validateEnv();

  if (!skipDb) {
    await testConnection();
  } else {
    console.warn('⚠️ SKIP_DB=true — skipping database connection check (safe mode)');
  }

  app.listen(PORT, () =>
    console.log(`✅ YAM Media API — http://localhost:${PORT} [${process.env.NODE_ENV || 'dev'}]`)
  );

  // Start scheduler only when DB is available
  if (!skipDb) startScheduler();
}

start().catch(err => { console.error('❌ Démarrage échoué:', err); process.exit(1); });
export default app;
