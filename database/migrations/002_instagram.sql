-- Migration 002 : Table instagram_posts
-- Exécuter après 001_init.sql

CREATE TABLE IF NOT EXISTS instagram_posts (
  id             SERIAL PRIMARY KEY,
  caption        TEXT NOT NULL,
  article_ids    INTEGER[] NOT NULL DEFAULT '{}',
  ig_post_id     VARCHAR(100),                    -- null en mode simulation
  simulation     BOOLEAN NOT NULL DEFAULT true,
  scheduled_slot VARCHAR(50),                     -- 'Matinée', 'Midi', etc.
  published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ig_posts_published ON instagram_posts(published_at DESC);
