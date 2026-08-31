-- ==============================================================================
-- FLOWCHART QUEST (FLOWCHART LAB) - SUPABASE POSTGRESQL SCHEMA & REALTIME SETUP
-- Single Source of Truth for Student Identity, Progress & Activity Tracking
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create updated_at Helper Function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. Table: students
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code TEXT NOT NULL DEFAULT '',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    classroom TEXT NOT NULL,
    student_number INT NOT NULL,
    registration_source TEXT NOT NULL DEFAULT 'self_registration',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_students_classroom_number UNIQUE (classroom, student_number)
);


-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_students_classroom ON public.students (classroom);
CREATE INDEX IF NOT EXISTS idx_students_last_active ON public.students (last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students (first_name, last_name);

CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ------------------------------------------------------------------------------
-- 4. Table: sessions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_student ON public.sessions (student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON public.sessions (last_seen_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Table: progress
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    current_stage TEXT NOT NULL DEFAULT 'intro',
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_progress_student_lesson UNIQUE (student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_student ON public.progress (student_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON public.progress (status);

CREATE TRIGGER trg_progress_updated_at
BEFORE UPDATE ON public.progress
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ------------------------------------------------------------------------------
-- 6. Table: activity_attempts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL,
    answer JSONB,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    attempt_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_attempts_student ON public.activity_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_activity ON public.activity_attempts (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_created ON public.activity_attempts (created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. Table: events
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_student ON public.events (student_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events (event_type);

-- ------------------------------------------------------------------------------
-- 8. Table: lessons (Cloud Lesson Management & Google Drive PDFs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    chapter_num INT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    pdf_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default 5 learning chapters
INSERT INTO public.lessons (id, chapter_num, title, subtitle, pdf_url)
VALUES
    ('ch1', 1, 'บทที่ 1: ความหมายของ Flowchart (ผังงาน)', 'ทำความเข้าใจจุดเริ่มต้นของการคิดอย่างเป็นระบบ', 'https://drive.google.com/file/d/1o1yiGrO_Kv5Re782rDkev7o4XYbcx2CD/preview'),
    ('ch2', 2, 'บทที่ 2: สัญลักษณ์ Flowchart มาตรฐาน', 'เรียนรู้ทั้ง "รูปร่าง" และ "หน้าที่" ตามมาตรฐานสากล ANSI/ISO', 'https://drive.google.com/file/d/1_ObmghOM2pd0yczYzvoGmMBngt_W_WRk/preview'),
    ('ch3', 3, 'บทที่ 3: ลำดับขั้นตอน (Sequence Flow)', 'การเรียงขั้นตอนการทำงานอย่างเป็นระบบจากบนลงล่าง', 'https://drive.google.com/file/d/1Jrpliew22l4-OqHKZAYrFIQaXbFzfus8/preview'),
    ('ch4', 4, 'บทที่ 4: การตัดสินใจและเงื่อนไข (Decision Flow)', 'การตรวจสอบเงื่อนไขแบบ จริง/เท็จ ในชีวิตประจำวัน', 'https://drive.google.com/file/d/1jEe3CBveyyh8y024CYm7BeI4OEKOOWXj/preview'),
    ('ch5', 5, 'บทที่ 5: การทำงานแบบวนซ้ำ (Loop Flow)', 'การทำขั้นตอนซ้ำๆ อย่างมีประสิทธิภาพและเงื่อนไขการหยุด', 'https://drive.google.com/file/d/1o2nI6QAxBhq7BdTyuAiY1WfRdeWKmRNI/preview')
ON CONFLICT (id) DO UPDATE 
SET 
    chapter_num = EXCLUDED.chapter_num,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    pdf_url = EXCLUDED.pdf_url,
    updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 9. Table: classrooms (Classrooms & PIN Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classrooms (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sheet_tab TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.classrooms (id, code, name, sheet_tab, active)
VALUES
    ('room_601', '601', 'ห้อง ป.6/1', 'ป.6_1', true),
    ('room_602', '602', 'ห้อง ป.6/2', 'ป.6_2', true),
    ('room_603', '603', 'ห้อง ป.6/3', 'ป.6_3', true),
    ('room_604', '604', 'ห้อง ป.6/4', 'ป.6_4', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- Allow public read access to lessons and classrooms
CREATE POLICY "Public read lessons" ON public.lessons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public update lessons" ON public.lessons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read classrooms" ON public.classrooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public update classrooms" ON public.classrooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow public student registration & queries
CREATE POLICY "Allow public insert students" ON public.students FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public select students" ON public.students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public update students" ON public.students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow sessions operations
CREATE POLICY "Allow public sessions" ON public.sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow progress operations
CREATE POLICY "Allow public progress" ON public.progress FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow activity_attempts operations
CREATE POLICY "Allow public activity_attempts" ON public.activity_attempts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow events operations
CREATE POLICY "Allow public events" ON public.events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 11. Supabase Realtime Replication Setup
-- ------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;
