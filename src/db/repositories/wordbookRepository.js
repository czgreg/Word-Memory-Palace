import { dbService } from '../database';

/**
 * 解析 Markdown 格式的单词列表
 * 支持两种格式：
 * 1. 表格式: | 单词 | 词性 | 词义 |
 * 2. 行式: abandon v. 放弃  或  abandon: 放弃
 */
function parseMarkdown(mdContent) {
    const lines = mdContent.trim().split('\n');
    const entries = [];

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        // 跳过表头分隔线
        if (/^\|?\s*[-:]+\s*\|/.test(line)) continue;
        // 跳过纯表头行（含"单词""词性""词义"关键字）
        if (/单词|word/i.test(line) && /词义|meaning/i.test(line)) continue;

        // 1. 表格式: | word | pos | meaning |
        if (line.includes('|')) {
            const cells = line.split('|').map(s => s.trim()).filter(Boolean);
            if (cells.length >= 2) {
                const word = cells[0];
                const partOfSpeech = cells.length >= 3 ? cells[1] : '';
                const meaning = cells.length >= 3 ? cells[2] : cells[1];
                if (word) entries.push({ word, part_of_speech: partOfSpeech, meaning });
            }
            continue;
        }

        // 2. 冒号式: abandon: 放弃  或  abandon v.: 放弃
        if (line.includes(':')) {
            const colonIdx = line.indexOf(':');
            // 检查冒号前是否有词性（如 "abandon v."）
            const before = line.slice(0, colonIdx).trim();
            const meaning = line.slice(colonIdx + 1).trim();
            const posMatch = before.match(/^(\S+)\s+((?:n|v|adj|adv|prep|conj|pron|det|interj|aux|art)\.?\s*.*)$/i);
            if (posMatch) {
                entries.push({ word: posMatch[1], part_of_speech: posMatch[2].trim(), meaning });
            } else {
                entries.push({ word: before, part_of_speech: '', meaning });
            }
            continue;
        }

        // 3. 空格式: abandon v. 放弃
        // 尝试匹配: 单词 词性 词义
        const spaceMatch = line.match(/^(\S+)\s+((?:n|v|adj|adv|prep|conj|pron|det|interj|aux|art)\.?\s*\.?)\s+(.+)$/i);
        if (spaceMatch) {
            entries.push({
                word: spaceMatch[1],
                part_of_speech: spaceMatch[2].trim(),
                meaning: spaceMatch[3].trim()
            });
            continue;
        }

        // 4. 最简单的: 单词 词义（仅两部分）
        const simpleMatch = line.match(/^(\S+)\s+(.+)$/);
        if (simpleMatch) {
            entries.push({
                word: simpleMatch[1],
                part_of_speech: '',
                meaning: simpleMatch[2].trim()
            });
        }
    }

    return entries;
}

export const wordbookRepository = {
    parseMarkdown,

    getAll: async () => {
        return dbService.query(`
            SELECT wb.*,
                COUNT(we.id) as entry_count,
                SUM(CASE WHEN we.is_known = 1 THEN 1 ELSE 0 END) as known_count,
                SUM(CASE WHEN we.is_known = 0 THEN 1 ELSE 0 END) as unknown_count,
                SUM(CASE WHEN we.is_known = -1 THEN 1 ELSE 0 END) as unreviewed_count
            FROM wordbooks wb
            LEFT JOIN wordbook_entries we ON wb.id = we.wordbook_id
            GROUP BY wb.id
            ORDER BY wb.created_at DESC
        `);
    },

    getById: async (id) => {
        const results = await dbService.query(`SELECT * FROM wordbooks WHERE id = ?`, [id]);
        return results.length > 0 ? results[0] : null;
    },

    create: async (name, description = '') => {
        const result = await dbService.run(
            `INSERT INTO wordbooks (name, description) VALUES (?, ?)`,
            [name, description]
        );
        return result.lastInsertRowid;
    },

    delete: async (id) => {
        return dbService.runBatch([
            { sql: `DELETE FROM wordbook_entries WHERE wordbook_id = ?`, params: [id] },
            { sql: `DELETE FROM wordbooks WHERE id = ?`, params: [id] }
        ]);
    },

    importMarkdown: async (wordbookId, mdContent) => {
        const entries = parseMarkdown(mdContent);
        if (entries.length === 0) throw new Error('未解析到任何单词，请检查格式');

        const statements = entries.map((e, i) => ({
            sql: `INSERT INTO wordbook_entries (wordbook_id, word, part_of_speech, meaning) VALUES (?, ?, ?, ?)`,
            params: [wordbookId, e.word, e.part_of_speech, e.meaning]
        }));

        // 更新总词数
        statements.push({
            sql: `UPDATE wordbooks SET total_words = (SELECT COUNT(*) FROM wordbook_entries WHERE wordbook_id = ?) WHERE id = ?`,
            params: [wordbookId, wordbookId]
        });

        await dbService.runBatch(statements);
        return entries.length;
    },

    getEntries: async (wordbookId) => {
        return dbService.query(
            `SELECT * FROM wordbook_entries WHERE wordbook_id = ? ORDER BY id ASC`,
            [wordbookId]
        );
    },

    getUnreviewedBatch: async (wordbookId, batchSize = 50) => {
        return dbService.query(
            `SELECT * FROM wordbook_entries WHERE wordbook_id = ? AND is_known = -1 ORDER BY id ASC LIMIT ?`,
            [wordbookId, batchSize]
        );
    },

    markEntry: async (entryId, isKnown, round = 0) => {
        return dbService.run(
            `UPDATE wordbook_entries SET is_known = ?, review_round = ? WHERE id = ?`,
            [isKnown ? 1 : 0, round, entryId]
        );
    },

    getUnknownWords: async (wordbookId) => {
        return dbService.query(
            `SELECT * FROM wordbook_entries WHERE wordbook_id = ? AND is_known = 0 ORDER BY id ASC`,
            [wordbookId]
        );
    },

    getUnknownCount: async (wordbookId) => {
        const results = await dbService.query(
            `SELECT COUNT(*) as count FROM wordbook_entries WHERE wordbook_id = ? AND is_known = 0`,
            [wordbookId]
        );
        return results[0]?.count || 0;
    },

    resetEntries: async (wordbookId) => {
        return dbService.run(
            `UPDATE wordbook_entries SET is_known = -1, review_round = 0 WHERE wordbook_id = ?`,
            [wordbookId]
        );
    },

    // 将不认识的词标记为已处理（构建宫殿后）
    clearUnknownWords: async (wordbookId, entryIds) => {
        if (!entryIds || entryIds.length === 0) return;
        const placeholders = entryIds.map(() => '?').join(',');
        return dbService.run(
            `UPDATE wordbook_entries SET is_known = -2 WHERE wordbook_id = ? AND id IN (${placeholders})`,
            [wordbookId, ...entryIds]
        );
    },

    // 更新单个词条的词性和词义
    updateEntry: async (entryId, partOfSpeech, meaning) => {
        return dbService.run(
            `UPDATE wordbook_entries SET part_of_speech = ?, meaning = ? WHERE id = ?`,
            [partOfSpeech, meaning, entryId]
        );
    }
};
