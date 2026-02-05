-- Login logbook table
CREATE TABLE IF NOT EXISTS login_log (
  id BIGSERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_log_created_at ON login_log(created_at DESC);
CREATE INDEX idx_login_log_email ON login_log(email);
