/*
  # Create water bodies and custom lakes tables

  1. New Tables
    - `water_bodies`
      - `id` (uuid, primary key)
      - `key` (text, unique) - short identifier like 'preslar', 'bigriver'
      - `name` (text) - display name
      - `location` (text) - area description
      - `region` (text) - region tab key (fenton, westcounty, etc.)
      - `type` (text) - lake, pond, river, reservoir
      - `species` (text array) - fish species present
      - `tags` (jsonb) - additional tags (special regs, notes, etc.)
      - `latitude` (float) - geographic latitude
      - `longitude` (float) - geographic longitude
      - `spots` (jsonb) - array of spot objects with name, detail, shallow/deep/always flags
      - `special_regs` (text) - special regulations text
      - `created_at` (timestamptz)

    - `custom_lakes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - owner of the custom lake
      - `name` (text)
      - `location` (text)
      - `type` (text) - pond, lake, river, reservoir
      - `notes` (text)
      - `created_at` (timestamptz)

    - `admin_lakes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location` (text)
      - `region` (text)
      - `type` (text)
      - `species` (text array)
      - `spots` (jsonb)
      - `special_regs` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - water_bodies: readable by all authenticated users
    - custom_lakes: users can only CRUD their own lakes
    - admin_lakes: readable by all authenticated users, insert/update/delete only for service role
*/

CREATE TABLE IF NOT EXISTS water_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  region text NOT NULL,
  type text NOT NULL DEFAULT 'lake',
  species text[] DEFAULT '{}',
  tags jsonb DEFAULT '[]',
  latitude double precision,
  longitude double precision,
  spots jsonb DEFAULT '[]',
  special_regs text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE water_bodies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read water bodies"
  ON water_bodies FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS custom_lakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text DEFAULT '',
  type text NOT NULL DEFAULT 'pond',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_lakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own custom lakes"
  ON custom_lakes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom lakes"
  ON custom_lakes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom lakes"
  ON custom_lakes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom lakes"
  ON custom_lakes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS admin_lakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  region text NOT NULL,
  type text NOT NULL DEFAULT 'lake',
  species text[] DEFAULT '{}',
  spots jsonb DEFAULT '[]',
  special_regs text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_lakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read admin lakes"
  ON admin_lakes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert admin lakes"
  ON admin_lakes FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update admin lakes"
  ON admin_lakes FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete admin lakes"
  ON admin_lakes FOR DELETE
  TO service_role
  USING (true);
