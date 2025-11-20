-- Create passwords table for individual password management
CREATE TABLE IF NOT EXISTS passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS passwords_user_id_idx ON passwords(user_id);

-- Enable Row Level Security
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own passwords
CREATE POLICY "Users can view own passwords"
  ON passwords
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own passwords
CREATE POLICY "Users can insert own passwords"
  ON passwords
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own passwords
CREATE POLICY "Users can update own passwords"
  ON passwords
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own passwords
CREATE POLICY "Users can delete own passwords"
  ON passwords
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at
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
