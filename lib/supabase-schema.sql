-- Create tables for the QR code generator app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create batches table
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create QR codes table
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  name TEXT,
  description TEXT,
  svg_path TEXT,
  png_path TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scans table to track QR code usage
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blocked IPs table
CREATE TABLE blocked_ips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create security logs table
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  details TEXT,
  severity TEXT NOT NULL, -- high, medium, low
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_block_ips BOOLEAN DEFAULT TRUE,
  scan_threshold INTEGER DEFAULT 50,
  time_window INTEGER DEFAULT 10, -- minutes
  notify_on_suspicious BOOLEAN DEFAULT TRUE,
  enable_geo_restriction BOOLEAN DEFAULT FALSE,
  allowed_countries TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies

-- Users can only see and modify their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_policy ON users
  USING (id = auth.uid());

-- Batches policies
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY batches_select_policy ON batches
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY batches_insert_policy ON batches
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY batches_update_policy ON batches
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY batches_delete_policy ON batches
  FOR DELETE USING (user_id = auth.uid());

-- QR codes policies
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY qr_codes_select_policy ON qr_codes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY qr_codes_insert_policy ON qr_codes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY qr_codes_update_policy ON qr_codes
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY qr_codes_delete_policy ON qr_codes
  FOR DELETE USING (user_id = auth.uid());

-- Scans policies (users can only see scans of their QR codes)
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY scans_select_policy ON scans
  FOR SELECT USING (
    qr_code_id IN (
      SELECT id FROM qr_codes WHERE user_id = auth.uid()
    )
  );

-- Blocked IPs policies
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY blocked_ips_select_policy ON blocked_ips
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY blocked_ips_insert_policy ON blocked_ips
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY blocked_ips_delete_policy ON blocked_ips
  FOR DELETE USING (user_id = auth.uid());

-- Security logs policies
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY security_logs_select_policy ON security_logs
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- User settings policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_settings_select_policy ON user_settings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_settings_insert_policy ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_settings_update_policy ON user_settings
  FOR UPDATE USING (user_id = auth.uid());
