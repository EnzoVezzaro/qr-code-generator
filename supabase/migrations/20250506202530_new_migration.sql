/*
  # Create demo users and profiles

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text, either 'admin' or 'staff')
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on profiles table
    - Add policy for users to read their own profile
  
  3. Demo Data
    - Create admin and staff demo users
    - Create corresponding profile entries
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create demo users
DO $$
DECLARE
  admin_id uuid;
  staff_id uuid;
BEGIN
  -- Create admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    encrypted_password,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_sent_at,
    email_confirmed_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@example.com',
    '{}',
    '{"provider":"email","providers":["email"]}',
    false,
    crypt('password', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    now(),
    false,
    null
  )
  RETURNING id INTO admin_id;

  -- Create staff user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    encrypted_password,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_sent_at,
    email_confirmed_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'staff@example.com',
    '{}',
    '{"provider":"email","providers":["email"]}',
    false,
    crypt('password', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    now(),
    false,
    null
  )
  RETURNING id INTO staff_id;

  -- Create profiles for users
  INSERT INTO profiles (id, role)
  VALUES 
    (admin_id, 'admin'),
    (staff_id, 'staff');
END $$;
