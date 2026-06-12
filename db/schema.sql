-- Bosla Works — D1 Database Schema
-- Run: npx wrangler d1 execute bosla-db --file=db/schema.sql --remote

PRAGMA foreign_keys = ON;

-- ── App users (platform accounts, managed by admin) ───────
CREATE TABLE IF NOT EXISTS app_users (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE,
  avatar          TEXT,
  system_role     TEXT NOT NULL DEFAULT 'member'
                  CHECK (system_role IN ('admin', 'member')),
  is_finance      INTEGER NOT NULL DEFAULT 0,
  is_content      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);

-- ── Project-level permissions ─────────────────────────────
CREATE TABLE IF NOT EXISTS project_permissions (
  user_id         TEXT NOT NULL,
  project_id      TEXT NOT NULL,
  access          TEXT NOT NULL DEFAULT 'all'
                  CHECK (access IN ('all', 'custom', 'none')),
  denied_tools    TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (user_id, project_id),
  FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
);

-- ── Projects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  name_en         TEXT,
  description     TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'planning',
  progress        INTEGER NOT NULL DEFAULT 0,
  color           TEXT NOT NULL DEFAULT '#6366F1',
  icon            TEXT NOT NULL DEFAULT 'folder',
  logo            TEXT,
  cover           TEXT,
  category        TEXT NOT NULL DEFAULT '',
  type            TEXT NOT NULL DEFAULT 'general',
  tools           TEXT NOT NULL DEFAULT '[]',
  tags            TEXT NOT NULL DEFAULT '[]',
  links           TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- ── Tasks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,
  project_id      TEXT,
  phase_id        TEXT,
  milestone_id    TEXT,
  sprint_id       TEXT,
  assignee_id     TEXT,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'todo',
  priority        TEXT NOT NULL DEFAULT 'medium',
  start_date      TEXT,
  due_date        TEXT,
  subtasks        TEXT NOT NULL DEFAULT '[]',
  tags            TEXT NOT NULL DEFAULT '[]',
  time_estimate   INTEGER,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Plans ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  icon            TEXT,
  kind            TEXT,
  domain          TEXT,
  view            TEXT,
  target_date     TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Plan phases ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_phases (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  plan_id         TEXT,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  objective       TEXT,
  start_date      TEXT,
  due_date        TEXT,
  status          TEXT NOT NULL DEFAULT 'upcoming',
  order_index     INTEGER NOT NULL DEFAULT 0,
  milestones      TEXT NOT NULL DEFAULT '[]',
  notes           TEXT,
  features        TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id)    REFERENCES plans    (id) ON DELETE SET NULL
);

-- ── Sprints (initiatives / مبادرات) ───────────────────────
CREATE TABLE IF NOT EXISTS sprints (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  goal            TEXT,
  start_date      TEXT,
  due_date        TEXT,
  status          TEXT NOT NULL DEFAULT 'planned',
  order_index     INTEGER NOT NULL DEFAULT 0,
  lead            TEXT,
  checklist       TEXT NOT NULL DEFAULT '[]',
  updates         TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Notes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  tags            TEXT NOT NULL DEFAULT '[]',
  pinned          INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Product docs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_docs (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  url             TEXT,
  type            TEXT NOT NULL DEFAULT 'other',
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Team members ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT '',
  email           TEXT,
  phone           TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  notes           TEXT,
  avatar          TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Schedule events ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_events (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  date            TEXT,
  start_time      TEXT,
  end_time        TEXT,
  location        TEXT,
  owner           TEXT,
  status          TEXT NOT NULL DEFAULT 'planned',
  notes           TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Meetings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL,
  title               TEXT NOT NULL,
  date                TEXT NOT NULL,
  start_time          TEXT,
  end_time            TEXT,
  kind                TEXT,
  kind_label          TEXT,
  attendees           TEXT NOT NULL DEFAULT '[]',
  agenda              TEXT NOT NULL DEFAULT '[]',
  achievements        TEXT,
  challenges          TEXT,
  decisions           TEXT NOT NULL DEFAULT '[]',
  recommendations     TEXT NOT NULL DEFAULT '[]',
  action_items        TEXT NOT NULL DEFAULT '[]',
  status              TEXT NOT NULL DEFAULT 'preparation',
  recurring           INTEGER NOT NULL DEFAULT 0,
  recurring_interval  TEXT,
  next_meeting_id     TEXT,
  created_at          TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Finance entries ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_entries (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  amount          REAL NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'SAR',
  category        TEXT,
  status          TEXT NOT NULL DEFAULT 'planned',
  date            TEXT,
  notes           TEXT,
  recurring       INTEGER NOT NULL DEFAULT 0,
  client_id       TEXT,
  billing_type    TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Service packages (باقات) ──────────────────────────────
CREATE TABLE IF NOT EXISTS finance_packages (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  price           REAL NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'SAR',
  deliverables    INTEGER,
  features        TEXT NOT NULL DEFAULT '[]',
  client_ids      TEXT NOT NULL DEFAULT '[]',
  color           TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── KPIs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kpis (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  value           REAL NOT NULL DEFAULT 0,
  unit            TEXT NOT NULL DEFAULT '',
  target          REAL,
  trend           TEXT,
  notes           TEXT,
  history         TEXT NOT NULL DEFAULT '[]',
  order_index     INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Clients ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL,
  name                TEXT NOT NULL,
  logo                TEXT,
  contact_name        TEXT,
  phone               TEXT,
  email               TEXT,
  contract_value      REAL NOT NULL DEFAULT 0,
  contract_currency   TEXT NOT NULL DEFAULT 'SAR',
  contract_start      TEXT,
  contract_end        TEXT,
  deliverable_count   INTEGER,
  status              TEXT NOT NULL DEFAULT 'active',
  notes               TEXT,
  order_index         INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Growth metrics ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS growth_metrics (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  value           REAL NOT NULL DEFAULT 0,
  unit            TEXT NOT NULL DEFAULT '',
  target          REAL,
  change          REAL,
  category        TEXT NOT NULL DEFAULT 'acquisition',
  order_index     INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Growth experiments ────────────────────────────────────
CREATE TABLE IF NOT EXISTS growth_experiments (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  hypothesis      TEXT,
  metric          TEXT,
  status          TEXT NOT NULL DEFAULT 'idea',
  result          TEXT,
  impact          INTEGER NOT NULL DEFAULT 3,
  confidence      INTEGER NOT NULL DEFAULT 3,
  ease            INTEGER NOT NULL DEFAULT 3,
  start_date      TEXT,
  end_date        TEXT,
  notes           TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Growth channels ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS growth_channels (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'other',
  status          TEXT NOT NULL DEFAULT 'active',
  notes           TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Content items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_items (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  client_id       TEXT,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'post',
  platform        TEXT,
  status          TEXT NOT NULL DEFAULT 'idea',
  due_date        TEXT,
  publish_date    TEXT,
  body            TEXT,
  dimensions      TEXT,
  source          TEXT,
  assignee_id     TEXT,
  checklist       TEXT NOT NULL DEFAULT '[]',
  notes           TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Portfolios (cross-project grouping) ───────────────────
CREATE TABLE IF NOT EXISTS portfolios (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT NOT NULL DEFAULT '#6366F1',
  icon            TEXT,
  logo            TEXT,
  project_ids     TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- ── Product profiles (investor-facing pitch documents) ────
CREATE TABLE IF NOT EXISTS product_profiles (
  id              TEXT PRIMARY KEY,          -- equals project_id (one per project)
  project_id      TEXT NOT NULL,
  tagline         TEXT NOT NULL DEFAULT '',
  overview        TEXT NOT NULL DEFAULT '',
  problem         TEXT NOT NULL DEFAULT '',
  solution        TEXT NOT NULL DEFAULT '',
  sub_products    TEXT NOT NULL DEFAULT '[]', -- JSON: [{id,name,description}]
  market          TEXT NOT NULL DEFAULT '',
  goals           TEXT NOT NULL DEFAULT '[]', -- JSON: string[]
  advantages      TEXT NOT NULL DEFAULT '[]', -- JSON: string[]
  business_model  TEXT NOT NULL DEFAULT '',
  team            TEXT NOT NULL DEFAULT '',
  contact         TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_project    ON product_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project       ON tasks           (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks           (status);
CREATE INDEX IF NOT EXISTS idx_plans_project       ON plans           (project_id);
CREATE INDEX IF NOT EXISTS idx_phases_project      ON plan_phases     (project_id);
CREATE INDEX IF NOT EXISTS idx_phases_plan         ON plan_phases     (plan_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project     ON sprints         (project_id);
CREATE INDEX IF NOT EXISTS idx_notes_project       ON notes           (project_id);
CREATE INDEX IF NOT EXISTS idx_docs_project        ON product_docs    (project_id);
CREATE INDEX IF NOT EXISTS idx_team_project        ON team_members    (project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_project    ON schedule_events (project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project    ON meetings        (project_id);
CREATE INDEX IF NOT EXISTS idx_finance_project     ON finance_entries (project_id);
CREATE INDEX IF NOT EXISTS idx_packages_project    ON finance_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_kpis_project        ON kpis            (project_id);
CREATE INDEX IF NOT EXISTS idx_clients_project     ON clients         (project_id);
CREATE INDEX IF NOT EXISTS idx_growth_m_project    ON growth_metrics  (project_id);
CREATE INDEX IF NOT EXISTS idx_growth_e_project    ON growth_experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_growth_c_project    ON growth_channels (project_id);
CREATE INDEX IF NOT EXISTS idx_content_project     ON content_items   (project_id);
CREATE INDEX IF NOT EXISTS idx_perms_user          ON project_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email     ON app_users       (email);
