CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_date DATE NOT NULL,
  entry_month CHAR(4) NOT NULL,
  entry_seq INTEGER NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  service_id BIGINT NOT NULL REFERENCES services(id),
  cost_hkd NUMERIC(12, 2) NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_month, entry_seq)
);

CREATE INDEX IF NOT EXISTS idx_sales_entries_month
  ON sales_entries (entry_month);

CREATE INDEX IF NOT EXISTS idx_sales_entries_date
  ON sales_entries (entry_date);

CREATE TABLE IF NOT EXISTS commission_handlers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_month CHAR(4) NOT NULL,
  client_name TEXT NOT NULL,
  handler_id BIGINT NOT NULL REFERENCES commission_handlers(id),
  item_shroud NUMERIC(12, 2) NOT NULL DEFAULT 0,
  item_quilt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  item_other NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  commission_rate NUMERIC(5, 4) NOT NULL,
  total_commission NUMERIC(12, 2) NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_entries_month
  ON commission_entries (entry_month);

CREATE TABLE IF NOT EXISTS cerement_reports (
  id BIGSERIAL PRIMARY KEY,
  entry_month CHAR(4) NOT NULL UNIQUE,
  amount_sifangjie NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_hk_shop NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_hk_pickup NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_branch_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_consultant NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cerement_reports_month
  ON cerement_reports (entry_month);

CREATE TABLE IF NOT EXISTS allowed_emails (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_audit (
  id BIGSERIAL PRIMARY KEY,
  email TEXT,
  status TEXT NOT NULL,
  provider TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at
  ON auth_audit (created_at DESC);
