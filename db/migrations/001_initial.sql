-- ─────────────────────────────────────────────────────────────────────────────
--  NOVA — Migración inicial (Hito 1)
--  Crea las tablas base de conversaciones y preferencias.
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabla: conversaciones ─────────────────────────────────────────────────────
-- Almacena cada mensaje del historial de chat (usuario + NOVA).
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id  UUID                               -- Para agrupar sesiones en el futuro
);

CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id  ON conversations (session_id);

-- ── Tabla: memorias ───────────────────────────────────────────────────────────
-- Hechos persistentes que NOVA debe recordar entre sesiones.
-- Se usa en el Hito 3, pero la creamos ya para no migrar después.
CREATE TABLE IF NOT EXISTS memories (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  key           VARCHAR(200) NOT NULL UNIQUE,
  value         TEXT         NOT NULL,
  category      VARCHAR(50)  NOT NULL DEFAULT 'general',
  importance    FLOAT        NOT NULL DEFAULT 0.5 CHECK (importance BETWEEN 0 AND 1),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_category   ON memories (category);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories (importance DESC);

-- ── Tabla: preferencias ───────────────────────────────────────────────────────
-- Configuración del usuario (nombre, idioma, preferencias de respuesta, etc.)
CREATE TABLE IF NOT EXISTS preferences (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  key        VARCHAR(100) NOT NULL UNIQUE,
  value      TEXT         NOT NULL,
  scope      VARCHAR(50)  NOT NULL DEFAULT 'user',
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Preferencias por defecto
INSERT INTO preferences (key, value, scope) VALUES
  ('user_name',      'Usuario',  'user'),
  ('nova_language',  'es',       'system'),
  ('response_style', 'concise',  'system')
ON CONFLICT (key) DO NOTHING;
