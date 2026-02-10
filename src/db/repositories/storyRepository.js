import { dbService } from '../database';

export const storyRepository = {
    getByRoomId: (roomId) => {
        const results = dbService.query(`SELECT * FROM stories WHERE room_id = ?`, [roomId]);
        return results.length > 0 ? results[0] : null;
    },

    upsert: async (roomId, content) => {
        const existing = dbService.query(`SELECT id FROM stories WHERE room_id = ?`, [roomId]);

        if (existing.length > 0) {
            return dbService.run(
                `UPDATE stories SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE room_id = ?`,
                [content, roomId]
            );
        } else {
            return dbService.run(
                `INSERT INTO stories (room_id, content) VALUES (?, ?)`,
                [roomId, content]
            );
        }
    }
};
