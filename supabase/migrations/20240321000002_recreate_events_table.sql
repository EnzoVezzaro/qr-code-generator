-- Drop existing events table and its dependencies
DROP TABLE IF EXISTS check_ins CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Recreate events table with all required fields
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 100,
    qr_usage_limit INTEGER NOT NULL DEFAULT 1,
    check_in_message TEXT,
    check_in_color TEXT DEFAULT '#7C3AED',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate participants table
CREATE TABLE participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate check_ins table
CREATE TABLE check_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_check_ins_event_id ON check_ins(event_id);
CREATE INDEX idx_check_ins_participant_id ON check_ins(participant_id);

-- Recreate RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Recreate policies for events
CREATE POLICY "Events are viewable by authenticated users"
    ON events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Events can be created by authenticated users"
    ON events FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Recreate policies for participants
CREATE POLICY "Participants are viewable by authenticated users"
    ON participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Participants can be created by authenticated users"
    ON participants FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Recreate policies for check_ins
CREATE POLICY "Check-ins are viewable by authenticated users"
    ON check_ins FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Check-ins can be created by authenticated users"
    ON check_ins FOR INSERT
    TO authenticated
    WITH CHECK (true); 