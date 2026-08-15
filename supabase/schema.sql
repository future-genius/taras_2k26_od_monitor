-- =======================================================
-- TARAS 2K26 — Simplified Schema for Anon Key Access
-- No Supabase Auth required — RLS allows anon reads/writes
-- Run this in Supabase SQL Editor
-- =======================================================

-- Drop existing tables if re-running (safe re-run)
DROP TABLE IF EXISTS daily_od_records CASCADE;
DROP TABLE IF EXISTS taras_events CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- ─────────────────────────────────────────────────────────
-- 1. STUDENTS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    register_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'ECE',
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Student',
    date_of_birth TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_students_reg_no ON students(register_number);
CREATE INDEX idx_students_year ON students(year);
CREATE INDEX idx_students_section ON students(section);
CREATE INDEX idx_students_status ON students(status);

-- Enable RLS but allow anon key full access
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 2. TARAS EVENTS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE taras_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    date TEXT,
    venue TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

ALTER TABLE taras_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON taras_events FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON taras_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 3. DAILY OD RECORDS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE daily_od_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    register_number TEXT NOT NULL,
    section TEXT NOT NULL,
    year TEXT NOT NULL,
    role TEXT DEFAULT 'Student',
    department TEXT NOT NULL DEFAULT 'ECE',
    date TEXT NOT NULL,
    work_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('OD', 'Absent')),
    marked_by TEXT NOT NULL,
    marked_at TEXT NOT NULL,
    remarks TEXT DEFAULT ''
);

CREATE INDEX idx_od_date ON daily_od_records(date);
CREATE INDEX idx_od_work_name ON daily_od_records(work_name);
CREATE INDEX idx_od_student ON daily_od_records(student_id);
CREATE INDEX idx_od_date_work ON daily_od_records(date, work_name);

ALTER TABLE daily_od_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON daily_od_records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON daily_od_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 4. AUDIT LOGS TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    student_reg_no TEXT NOT NULL,
    student_name TEXT,
    details TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
