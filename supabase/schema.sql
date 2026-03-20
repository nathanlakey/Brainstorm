-- ================================================================
-- BrainStorm — Supabase Schema
-- Run this entire script in: Supabase Dashboard → SQL Editor → New query
-- ================================================================

-- ── Table: projects ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL    DEFAULT now()
);

-- ── Table: tasks ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  notes       TEXT,
  status      TEXT        NOT NULL DEFAULT 'Idea'
                          CHECK (status IN ('Idea', 'In Progress', 'Done', 'Archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks (project_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx     ON tasks (status);

-- ── Row Level Security ───────────────────────────────────────────
--  Open / public access (no auth). Tighten these policies once you
--  add Supabase Auth (e.g. USING (auth.uid() = owner_id)).
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_all_tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);
