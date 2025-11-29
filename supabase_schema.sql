-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Appointments Table (Mawa3id)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  notes TEXT,
  google_maps_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own appointments" ON appointments
  USING (auth.uid() = user_id);

-- 2. Tasks Table (Maham)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  date DATE,
  time TIME,
  section TEXT,
  priority TEXT,
  status TEXT,
  description TEXT,
  recurrence JSONB,
  subtasks JSONB DEFAULT '[]'::jsonb,
  from_voice BOOLEAN DEFAULT FALSE,
  rolled_over BOOLEAN DEFAULT FALSE,
  reminder_time TEXT,
  text TEXT,
  due_date DATE,
  last_completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own tasks" ON tasks
  USING (auth.uid() = user_id);

-- 3. Development Goals Table (Ahdaf Tatwir)
CREATE TABLE IF NOT EXISTS development_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- book, video, course, habit
  frequency TEXT, -- once, weekly, monthly, daily
  status TEXT DEFAULT 'active',
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE development_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own development goals" ON development_goals
  USING (auth.uid() = user_id);

-- 4. Reading Goals Table (Quran & Books)
CREATE TABLE IF NOT EXISTS reading_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  book_name TEXT NOT NULL,
  total_pages INTEGER NOT NULL,
  current_page INTEGER DEFAULT 0,
  deadline_days INTEGER,
  pages_per_day INTEGER,
  start_date DATE DEFAULT CURRENT_DATE,
  is_quran BOOLEAN DEFAULT FALSE,
  mode TEXT, -- tilawah, hifz
  completed BOOLEAN DEFAULT FALSE,
  scope_type TEXT, -- juz, surah, verses, khatmah
  scope_value TEXT,
  daily_target INTEGER,
  duration_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own reading goals" ON reading_goals
  USING (auth.uid() = user_id);

-- 5. Habits Table (3adat)
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  tracking JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own habits" ON habits
  USING (auth.uid() = user_id);

-- 6. Prayer Settings Table (Mawaqit Salat Settings)
CREATE TABLE IF NOT EXISTS prayer_settings (
  user_id UUID PRIMARY KEY DEFAULT auth.uid(),
  notify_at_adhan BOOLEAN DEFAULT TRUE,
  notify_before_adhan BOOLEAN DEFAULT FALSE,
  minutes_before_adhan INTEGER DEFAULT 15,
  selected_prayers TEXT[] DEFAULT ARRAY['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
  calculation_method TEXT,
  madhab TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prayer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own prayer settings" ON prayer_settings
  USING (auth.uid() = user_id);

-- 7. Adhkar Table
CREATE TABLE IF NOT EXISTS adhkar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  target INTEGER DEFAULT 100,
  type TEXT, -- morning, evening, general
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE adhkar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own adhkar" ON adhkar
  USING (auth.uid() = user_id);
