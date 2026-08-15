-- =======================================================
-- TARAS Student Monitoring System - PostgreSQL Schema
-- ECE-Only, TARAS Symposium Architecture, Supabase RLS
-- =======================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('PRESIDENT', 'STAFF', 'STUDENT');
CREATE TYPE student_status AS ENUM ('Active', 'Inactive', 'Graduated', 'Transferred');
CREATE TYPE event_category AS ENUM (
    'Technical', 'Workshop', 'Competition', 'Paper Presentation',
    'Project', 'Quiz', 'Coding', 'Other'
);
CREATE TYPE event_status AS ENUM (
    'Upcoming', 'Registration Open', 'Registration Closed',
    'Ongoing', 'Completed', 'Cancelled'
);
CREATE TYPE participation_status AS ENUM ('Registered', 'Present', 'Absent');
CREATE TYPE event_result AS ENUM ('Winner', 'Runner-up', 'Finalist', 'Participant', '');

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    register_number VARCHAR(50) UNIQUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS TABLE (ECE Exclusive)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL DEFAULT 'ECE',
    year VARCHAR(10) NOT NULL,
    section VARCHAR(10) NOT NULL,
    date_of_birth VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    status student_status DEFAULT 'Active',
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimized Performance Indexes for 1000+ Concurrent Queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_reg_no ON students(register_number);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_year ON students(year);
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- 4. TARAS EVENTS TABLE (TARAS Single Symposium Hierarchy)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(255) NOT NULL,
    event_code VARCHAR(50) UNIQUE NOT NULL,
    category event_category DEFAULT 'Technical',
    description TEXT,
    date DATE,
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    venue VARCHAR(255),
    coordinator VARCHAR(255),
    max_participants INTEGER DEFAULT 100,
    registration_status VARCHAR(20) DEFAULT 'Open',
    event_status event_status DEFAULT 'Upcoming',
    created_by VARCHAR(255) NOT NULL DEFAULT 'President',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_code ON events(event_code);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(event_status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- 5. EVENT PARTICIPANTS TABLE (Many-to-Many: Student <-> Event)
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    register_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    section VARCHAR(10) NOT NULL,
    year VARCHAR(10) NOT NULL,
    participation_status participation_status DEFAULT 'Registered',
    result VARCHAR(50) DEFAULT '',
    position INTEGER,
    prize VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_event_student UNIQUE(event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_student_id ON event_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(participation_status);
CREATE INDEX IF NOT EXISTS idx_event_participants_regno ON event_participants(register_number);

-- 6. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(255) NOT NULL,
    user_role user_role NOT NULL,
    action VARCHAR(255) NOT NULL,
    student_reg_no VARCHAR(50) NOT NULL,
    student_name VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- =======================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- STUDENTS RLS POLICIES
CREATE POLICY "Allow read access for all authenticated users"
ON students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow President to insert students"
ON students FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'PRESIDENT');

CREATE POLICY "Allow President to update students"
ON students FOR UPDATE TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'PRESIDENT');

CREATE POLICY "Allow President to delete students"
ON students FOR DELETE TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'PRESIDENT');

-- EVENTS RLS POLICIES
CREATE POLICY "Allow read access for events"
ON events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow President to manage events"
ON events FOR ALL TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'PRESIDENT');

-- EVENT PARTICIPANTS RLS POLICIES
CREATE POLICY "Allow read access for participants"
ON event_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow President to manage participants"
ON event_participants FOR ALL TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'PRESIDENT');

-- AUDIT LOGS RLS POLICIES
CREATE POLICY "Allow President to view audit logs"
ON audit_logs FOR SELECT TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'PRESIDENT');

-- =======================================================
-- ONLY PRESIDENT SEED (NO DEMO STUDENTS OR FAKE STAFF)
-- =======================================================
INSERT INTO users (name, email, role) VALUES
('Hariharan R', 'president@taras.edu', 'PRESIDENT')
ON CONFLICT (email) DO NOTHING;
