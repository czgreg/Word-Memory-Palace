import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 数据库文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'memory-palace.db');

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据库
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
db.exec(`
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
    type TEXT,
    question_types TEXT,
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
`);

console.log(`✅ 数据库已初始化: ${DB_PATH}`);

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', dbPath: DB_PATH });
});

// 查询 API — 返回行数组
app.post('/api/db/query', (req, res) => {
    try {
        const { sql, params = [] } = req.body;
        const stmt = db.prepare(sql);
        const rows = stmt.all(...params);
        res.json({ rows });
    } catch (err) {
        console.error('查询失败:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 执行 API — 返回 changes 和 lastInsertRowid
app.post('/api/db/run', (req, res) => {
    try {
        const { sql, params = [] } = req.body;
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        res.json({
            changes: result.changes,
            lastInsertRowid: Number(result.lastInsertRowid)
        });
    } catch (err) {
        console.error('执行失败:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 批量执行 API — 在事务中执行多条语句
app.post('/api/db/batch', (req, res) => {
    try {
        const { statements } = req.body;
        const results = [];

        const transaction = db.transaction(() => {
            for (const { sql, params = [] } of statements) {
                const stmt = db.prepare(sql);
                const result = stmt.run(...params);
                results.push({
                    changes: result.changes,
                    lastInsertRowid: Number(result.lastInsertRowid)
                });
            }
        });

        transaction();
        res.json({ results });
    } catch (err) {
        console.error('批量执行失败:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 后端服务运行中: http://localhost:${PORT}`);
    console.log(`📁 数据库路径: ${DB_PATH}`);
});
