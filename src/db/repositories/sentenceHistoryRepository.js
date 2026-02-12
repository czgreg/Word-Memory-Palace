import { dbService } from '../database';

export const sentenceHistoryRepository = {
    /**
     * 保存一条造句记录
     */
    save: async (wordId, word, sentence, review) => {
        return dbService.run(
            `INSERT INTO sentence_history (word_id, word, sentence, review) VALUES (?, ?, ?, ?)`,
            [wordId, word, sentence, review]
        );
    },

    /**
     * 获取某个单词的所有造句历史（按时间倒序）
     */
    getByWordId: async (wordId) => {
        return dbService.query(
            `SELECT * FROM sentence_history WHERE word_id = ? ORDER BY created_at DESC`,
            [wordId]
        );
    },

    /**
     * 获取所有有造句历史的单词（去重 + 计数），关联 words 表获取完整信息
     */
    getWordsWithHistory: async () => {
        return dbService.query(`
            SELECT 
                w.id as word_id,
                w.word,
                w.phonetic,
                w.part_of_speech,
                w.meaning,
                w.room_id,
                r.name as room_name,
                COUNT(sh.id) as sentence_count,
                MAX(sh.created_at) as last_practice_at
            FROM sentence_history sh
            JOIN words w ON sh.word_id = w.id
            LEFT JOIN rooms r ON w.room_id = r.id
            GROUP BY sh.word_id
            ORDER BY MAX(sh.created_at) DESC
        `);
    }
};
