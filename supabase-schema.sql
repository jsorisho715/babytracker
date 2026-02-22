-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  task TEXT NOT NULL,
  priority TEXT NOT NULL,
  timing TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  points INTEGER NOT NULL,
  completed_by TEXT,
  claimed_by TEXT,
  completed_at TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create shopping_items table
CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL,
  stock TEXT,
  status TEXT NOT NULL DEFAULT 'Need to Purchase',
  notes TEXT,
  points INTEGER NOT NULL,
  purchased_by TEXT,
  purchased_at TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_by TEXT,
  completed_at TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create player_scores table
CREATE TABLE IF NOT EXISTS player_scores (
  player TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_completed_date TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  player TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - you can lock down later)
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON shopping_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON player_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON badges FOR ALL USING (true) WITH CHECK (true);

-- Initialize player scores
INSERT INTO player_scores (player, display_name) VALUES ('johnathan', 'Johnathan')
ON CONFLICT (player) DO NOTHING;

INSERT INTO player_scores (player, display_name) VALUES ('jordyn', 'Jordyn')
ON CONFLICT (player) DO NOTHING;
