-- Migration 001 : Schéma initial YAM Media
-- Exécuter avec : psql $DATABASE_URL -f database/migrations/001_init.sql

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Table utilisateurs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table articles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  summary      TEXT NOT NULL,
  source_url   VARCHAR(500) UNIQUE NOT NULL,
  source_name  VARCHAR(100) NOT NULL,
  category     VARCHAR(50) NOT NULL,
  hashtags     TEXT[] DEFAULT '{}',
  importance   VARCHAR(10) NOT NULL DEFAULT 'moyenne' CHECK (importance IN ('haute', 'moyenne', 'faible')),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  views        INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Index pour les performances ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_status      ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category    ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published   ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_importance  ON articles(importance);

-- ── Trigger : mise à jour automatique de updated_at ───────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Données initiales : compte admin ─────────────────────────
-- Mot de passe par défaut : Admin@123  (À CHANGER EN PRODUCTION !)
-- Hash bcrypt généré avec saltRounds=12
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@yam-media.bf',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgHZ7Tl5b8hU.XMWH2A3Oy',
  'Admin YAM Media',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
