import { dbService } from '../database';

export const wordRepository = {
    getByRoomId: async (roomId) => {
        return dbService.query(
            `SELECT * FROM words WHERE room_id = ? ORDER BY order_index ASC`,
            [roomId]
        );
    },

    upsert: async (id, roomId, word, phonetic, partOfSpeech, meaning, orderIndex) => {
        if (id) {
            return dbService.run(
                `UPDATE words SET word = ?, phonetic = ?, part_of_speech = ?, meaning = ?, order_index = ? WHERE id = ?`,
                [word, phonetic, partOfSpeech, meaning, orderIndex, id]
            );
        } else {
            return dbService.run(
                `INSERT INTO words (room_id, word, phonetic, part_of_speech, meaning, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
                [roomId, word, phonetic, partOfSpeech, meaning, orderIndex]
            );
        }
    },

    delete: async (id) => {
        return dbService.run(`DELETE FROM words WHERE id = ?`, [id]);
    }
};
