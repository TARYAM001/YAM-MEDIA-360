-- Migration 003 : Analytics · Chatbot YAMI · Optimisation IA
-- Exécuter : psql $DATABASE_URL -f database/migrations/003_analytics_chatbot.sql

-- ── TikTok posts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tiktok_posts (
  id                SERIAL PRIMARY KEY,
  title             VARCHAR(255),
  caption           TEXT NOT NULL,
  article_ids       INTEGER[] NOT NULL DEFAULT '{}',
  tiktok_publish_id VARCHAR(100),
  simulated         BOOLEAN NOT NULL DEFAULT true,
  status            VARCHAR(20) NOT NULL DEFAULT 'published'
                      CHECK (status IN ('published','failed')),
  slot_name         VARCHAR(50),
  published_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Analytics Instagram ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ig_analytics (
  id              SERIAL PRIMARY KEY,
  ig_post_id      VARCHAR(100) NOT NULL,
  slot_name       VARCHAR(50),
  published_at    TIMESTAMPTZ,
  reach           INTEGER      DEFAULT 0,
  impressions     INTEGER      DEFAULT 0,
  likes           INTEGER      DEFAULT 0,
  comments        INTEGER      DEFAULT 0,
  saves           INTEGER      DEFAULT 0,
  shares          INTEGER      DEFAULT 0,
  engagement_rate DECIMAL(6,4) DEFAULT 0,
  caption_length  INTEGER      DEFAULT 0,
  hashtag_count   INTEGER      DEFAULT 0,
  category        VARCHAR(50),
  raw_metrics     JSONB        DEFAULT '{}',
  fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Analytics TikTok ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tt_analytics (
  id              SERIAL PRIMARY KEY,
  tt_publish_id   VARCHAR(100) NOT NULL,
  slot_name       VARCHAR(50),
  published_at    TIMESTAMPTZ,
  views           INTEGER      DEFAULT 0,
  likes           INTEGER      DEFAULT 0,
  comments        INTEGER      DEFAULT 0,
  shares          INTEGER      DEFAULT 0,
  completion_rate DECIMAL(6,4) DEFAULT 0,
  engagement_rate DECIMAL(6,4) DEFAULT 0,
  category        VARCHAR(50),
  raw_metrics     JSONB        DEFAULT '{}',
  fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Schéma créatif (modifiable par YAMI) ─────────────────────
CREATE TABLE IF NOT EXISTS creative_schema (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(100) UNIQUE NOT NULL,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  VARCHAR(50) DEFAULT 'system',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Mémoire permanente du chatbot YAMI ───────────────────────
CREATE TABLE IF NOT EXISTS chatbot_memory (
  id           SERIAL PRIMARY KEY,
  session_id   VARCHAR(100),
  role         VARCHAR(20)  NOT NULL CHECK (role IN ('user','assistant','system')),
  content      TEXT         NOT NULL,
  context_type VARCHAR(50)  DEFAULT 'chat',
  metadata     JSONB        DEFAULT '{}',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Décisions d'optimisation de l'IA ─────────────────────────
CREATE TABLE IF NOT EXISTS ai_decisions (
  id               SERIAL PRIMARY KEY,
  decision_type    VARCHAR(50)  NOT NULL,
  previous_value   JSONB,
  new_value        JSONB,
  reasoning        TEXT,
  performance_data JSONB,
  applied_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  applied_by       VARCHAR(50)  DEFAULT 'ai_chatbot',
  reverted         BOOLEAN      DEFAULT false
);

-- ── Index ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ig_analytics_slot    ON ig_analytics(slot_name);
CREATE INDEX IF NOT EXISTS idx_ig_analytics_date    ON ig_analytics(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_analytics_fetch   ON ig_analytics(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_tt_analytics_slot    ON tt_analytics(slot_name);
CREATE INDEX IF NOT EXISTS idx_chatbot_session      ON chatbot_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_time         ON chatbot_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_type    ON ai_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_date    ON ai_decisions(applied_at DESC);

-- ── Données initiales : schéma créatif par défaut ────────────
INSERT INTO creative_schema (key, value, description, updated_by) VALUES
(
  'publish_slots',
  '[
    {"cron":"0 7 * * *",  "label":"Matinée","emoji":"🌅","active":true,"priority":1,"hour":7},
    {"cron":"0 12 * * *", "label":"Midi",   "emoji":"☀️", "active":true,"priority":2,"hour":12},
    {"cron":"0 18 * * *", "label":"Soirée", "emoji":"🌆","active":true,"priority":3,"hour":18},
    {"cron":"0 21 * * *", "label":"Nuit",   "emoji":"🌙","active":true,"priority":4,"hour":21}
  ]'::jsonb,
  'Créneaux publication Instagram+TikTok (UTC = heure Burkina Faso)', 'system'
),
(
  'caption_style',
  '{
    "tone": "informatif et dynamique",
    "language": "français",
    "emoji_density": "moderate",
    "cta": "Lien en bio pour plus | Commentez votre avis 👇",
    "max_length": 280,
    "hashtag_count": 15,
    "opening_format": "emoji percutant + question ou statistique choc",
    "structure": ["accroche","points_cles","contexte_burkina","cta","hashtags"]
  }'::jsonb,
  'Style et structure des légendes publiées', 'system'
),
(
  'hashtag_strategy',
  '{
    "permanent": ["#BurkinaFaso","#YAMMedia","#Actualités","#Ouagadougou","#Afrique"],
    "rotating_pools": {
      "engagement": ["#fyp","#pourtoi","#viral","#trending","#explore"],
      "geo":        ["#BF","#Ouaga","#AfriqueOccidentale","#AOF"],
      "media":      ["#News","#Breaking","#InfoAfrique","#MediaBF","#PresseBF"]
    },
    "category_specific": {
      "Sport":       ["#SportBF","#Football","#SportAfrique"],
      "Politique":   ["#PolitiqueBF","#Gouvernement","#Démocratie"],
      "Économie":    ["#ÉconomieBF","#Développement","#Investissement"],
      "Sécurité":    ["#SécuritéBF","#Sahel"],
      "Technologie": ["#TechAfrique","#DigitalBF","#Innovation"],
      "Culture":     ["#CultureBF","#ArtAfrique","#MusiqueBF"]
    }
  }'::jsonb,
  'Stratégie hashtags par contexte et catégorie', 'system'
),
(
  'optimization_rules',
  '{
    "auto_optimize": true,
    "min_posts_before_analysis": 10,
    "engagement_threshold_good": 0.04,
    "engagement_threshold_bad":  0.01,
    "analyze_every_days": 7,
    "max_slot_shift_hours": 2,
    "ab_test_enabled": false,
    "auto_apply_allowed_keys": ["caption_style","hashtag_strategy"]
  }'::jsonb,
  'Règles optimisation automatique — seuls caption_style et hashtag_strategy sont auto-appliqués', 'system'
)
ON CONFLICT (key) DO NOTHING;

-- ── Message système initial YAMI ─────────────────────────────
INSERT INTO chatbot_memory (role, content, context_type, metadata) VALUES (
  'system',
  'Tu es YAMI (YAM Media Intelligence), l''assistant IA intégré de YAM Media, 1er média d''information burkinabè encadré par l''IA. Tu as accès aux analytics Instagram et TikTok en temps réel, au schéma créatif complet, et à l''historique de toutes les décisions d''optimisation. Tu peux modifier les paramètres de publication directement.',
  'system',
  '{"version":"1.0","initialized":"true"}'::jsonb
) ON CONFLICT DO NOTHING;
