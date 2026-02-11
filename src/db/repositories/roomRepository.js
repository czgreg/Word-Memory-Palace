import { dbService } from '../database';

export const roomRepository = {
    getAll: async () => {
        return dbService.query(`
      SELECT r.*, COUNT(w.id) as word_count 
      FROM rooms r 
      LEFT JOIN words w ON r.id = w.room_id 
      GROUP BY r.id 
      ORDER BY r.order_index ASC
    `);
    },

    getByHouseId: async (houseId) => {
        return dbService.query(`
      SELECT r.*, COUNT(w.id) as word_count 
      FROM rooms r 
      LEFT JOIN words w ON r.id = w.room_id 
      WHERE r.house_id = ?
      GROUP BY r.id 
      ORDER BY r.order_index ASC
    `, [houseId]);
    },

    getById: async (id) => {
        const results = await dbService.query(`SELECT * FROM rooms WHERE id = ?`, [id]);
        return results.length > 0 ? results[0] : null;
    },

    create: async (name, houseId = null) => {
        const lastRoom = await dbService.query(
            houseId
                ? `SELECT MAX(order_index) as max_idx FROM rooms WHERE house_id = ?`
                : `SELECT MAX(order_index) as max_idx FROM rooms`,
            houseId ? [houseId] : []
        );
        const nextIdx = (lastRoom[0]?.max_idx || 0) + 1;

        const result = await dbService.run(
            `INSERT INTO rooms (name, house_id, order_index) VALUES (?, ?, ?)`,
            [name, houseId, nextIdx]
        );

        return result.lastInsertRowid;
    },

    update: async (id, name) => {
        return dbService.run(
            `UPDATE rooms SET name = ? WHERE id = ?`,
            [name, id]
        );
    },

    delete: async (id) => {
        return dbService.runBatch([
            { sql: `DELETE FROM words WHERE room_id = ?`, params: [id] },
            { sql: `DELETE FROM stories WHERE room_id = ?`, params: [id] },
            { sql: `DELETE FROM challenges WHERE room_id = ?`, params: [id] },
            { sql: `DELETE FROM rooms WHERE id = ?`, params: [id] },
        ]);
    },

    getStats: async () => {
        try {
            const stats = await dbService.query(`
              SELECT 
                (SELECT COUNT(*) FROM words WHERE word IS NOT NULL AND TRIM(word) != '') as total_words,
                (SELECT COUNT(*) FROM rooms) as total_rooms,
                (SELECT COUNT(*) FROM rooms WHERE is_completed = 1) as completed_rooms
            `);
            return stats[0] || { total_words: 0, total_rooms: 0, completed_rooms: 0 };
        } catch (e) {
            console.error("getStats error:", e);
            return { total_words: 0, total_rooms: 0, completed_rooms: 0 };
        }
    }
};
