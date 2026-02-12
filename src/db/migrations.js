export const migrations = `
  CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    house_id INTEGER,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (house_id) REFERENCES houses (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    phonetic TEXT,
    part_of_speech TEXT,
    meaning TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0,
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL UNIQUE,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    type TEXT, -- 'small' or 'mega'
    question_types TEXT, -- comma separated
    score INTEGER,
    total_questions INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS learning_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_words_learned INTEGER DEFAULT 0,
    rooms_completed INTEGER DEFAULT 0,
    last_study_date DATE
  );

  CREATE TABLE IF NOT EXISTS sentence_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    sentence TEXT NOT NULL,
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wordbooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    total_words INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wordbook_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wordbook_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    part_of_speech TEXT,
    meaning TEXT NOT NULL,
    is_known INTEGER DEFAULT -1,
    review_round INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wordbook_id) REFERENCES wordbooks (id) ON DELETE CASCADE
  );
`;
