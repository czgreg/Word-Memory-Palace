import { dbService } from '../database';

export const wordRepository = {
    getByRoomId: (roomId) => {
        return dbService.query(
            `SELECT * FROM words WHERE room_id = ? ORDER BY order_index ASC`,
            [roomId]
        );
    },

    upsert: async (id, roomId, word, phonetic, meaning, orderIndex) => {
        if (id) {
            return dbService.run(
                `UPDATE words SET word = ?, phonetic = ?, meaning = ?, order_index = ? WHERE id = ?`,
                [word, phonetic, meaning, orderIndex, id]
            );
        } else {
            return dbService.run(
                `INSERT INTO words (room_id, word, phonetic, meaning, order_index) VALUES (?, ?, ?, ?, ?)`,
                [roomId, word, phonetic, meaning, orderIndex]
            );
        }
    },

    delete: async (id) => {
        return dbService.run(`DELETE FROM words WHERE id = ?`, [id]);
    }
};
