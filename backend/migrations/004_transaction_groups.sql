ALTER TABLE fin_transactions
  ADD COLUMN IF NOT EXISTS group_id UUID;

CREATE TABLE IF NOT EXISTS fin_groups (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES fin_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE fin_groups ENABLE ROW LEVEL SECURITY;

ALTER TABLE fin_transactions
  ADD CONSTRAINT fin_transactions_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES fin_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fin_transactions_user_group
  ON fin_transactions(user_id, group_id);

CREATE INDEX IF NOT EXISTS idx_fin_groups_user_updated
  ON fin_groups(user_id, updated_at DESC);
