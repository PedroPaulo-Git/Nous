-- ============================================
-- CLEANUP & MIGRATION SCRIPT
-- Remove old password_vault and recreate passwords table
-- ============================================

-- 1. Drop old password_vault table completely
DROP TABLE IF EXISTS password_vault CASCADE;

-- 2. Drop existing passwords table and all policies
DROP POLICY IF EXISTS "Users can view own passwords" ON passwords;
DROP POLICY IF EXISTS "Users can insert own passwords" ON passwords;
DROP POLICY IF EXISTS "Users can update own passwords" ON passwords;
DROP POLICY IF EXISTS "Users can delete own passwords" ON passwords;
DROP TABLE IF EXISTS passwords CASCADE;

-- 3. Recreate passwords table from scratch
CREATE TABLE passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create index for faster user queries
CREATE INDEX passwords_user_id_idx ON passwords(user_id);

-- 5. Enable Row Level Security
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "Users can view own passwords"
  ON passwords
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passwords"
  ON passwords
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passwords"
  ON passwords
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own passwords"
  ON passwords
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_passwords_updated_at
  BEFORE UPDATE ON passwords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Tables cleaned up and recreated
-- ============================================
