import { dbService } from '../database';

export const roomRepository = {
    getAll: () => {
        return dbService.query(`
      SELECT r.*, COUNT(w.id) as word_count 
      FROM rooms r 
      LEFT JOIN words w ON r.id = w.room_id 
      GROUP BY r.id 
      ORDER BY r.order_index ASC
    `);
    },

    getByHouseId: (houseId) => {
        return dbService.query(`
      SELECT r.*, COUNT(w.id) as word_count 
      FROM rooms r 
      LEFT JOIN words w ON r.id = w.room_id 
      WHERE r.house_id = ?
      GROUP BY r.id 
      ORDER BY r.order_index ASC
    `, [houseId]);
    },

    getById: (id) => {
        const results = dbService.query(`SELECT * FROM rooms WHERE id = ?`, [id]);
        return results.length > 0 ? results[0] : null;
    },

    create: async (name, houseId = null) => {
        const lastRoom = dbService.query(
            houseId
                ? `SELECT MAX(order_index) as max_idx FROM rooms WHERE house_id = ?`
                : `SELECT MAX(order_index) as max_idx FROM rooms`,
            houseId ? [houseId] : []
        );
        const nextIdx = (lastRoom[0]?.max_idx || 0) + 1;

        await dbService.run(
            `INSERT INTO rooms (name, house_id, order_index) VALUES (?, ?, ?)`,
            [name, houseId, nextIdx]
        );

        const res = dbService.query(`SELECT last_insert_rowid() as id`);
        return res[0].id;
    },

    update: async (id, name) => {
        return dbService.run(
            `UPDATE rooms SET name = ? WHERE id = ?`,
            [name, id]
        );
    },

    delete: async (id) => {
        // sql.js 的 PRAGMA foreign_keys 不可靠，手动级联删除
        dbService.db.run(`DELETE FROM words WHERE room_id = ?`, [id]);
        dbService.db.run(`DELETE FROM stories WHERE room_id = ?`, [id]);
        dbService.db.run(`DELETE FROM challenges WHERE room_id = ?`, [id]);
        return dbService.run(`DELETE FROM rooms WHERE id = ?`, [id]);
    },

    getStats: () => {
        try {
            const stats = dbService.query(`
              SELECT 
                (SELECT COUNT(*) FROM words WHERE word IS NOT NULL AND TRIM(word) != '') as total_words,
                (SELECT COUNT(*) FROM rooms) as total_rooms,
                (SELECT COUNT(*) FROM rooms WHERE is_completed = 1) as completed_rooms
            `);
            return stats[0] || { total_words: 0, total_rooms: 0, completed_rooms: 0 };
        } catch (e) {
            console.error("getStats error:", e);
            try {
                const stats = dbService.query(`
                  SELECT 
                    (SELECT COUNT(*) FROM words WHERE word IS NOT NULL AND TRIM(word) != '') as total_words,
                    (SELECT COUNT(*) FROM rooms) as total_rooms,
                    0 as completed_rooms
                `);
                return stats[0] || { total_words: 0, total_rooms: 0, completed_rooms: 0 };
            } catch (e2) {
                return { total_words: 0, total_rooms: 0, completed_rooms: 0 };
            }
        }
    }
};
