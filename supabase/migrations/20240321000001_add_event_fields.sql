-- Add new columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS check_in_message TEXT,
ADD COLUMN IF NOT EXISTS check_in_color TEXT DEFAULT '#7C3AED',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing rows to have default values
UPDATE events
SET location = 'TBD',
    max_participants = 100,
    check_in_color = '#7C3AED'
WHERE location IS NULL; 