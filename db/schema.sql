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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_month, entry_seq)
);

CREATE INDEX IF NOT EXISTS idx_sales_entries_month
  ON sales_entries (entry_month);

CREATE INDEX IF NOT EXISTS idx_sales_entries_date
  ON sales_entries (entry_date);
