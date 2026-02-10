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

    getById: (id) => {
        const results = dbService.query(`SELECT * FROM rooms WHERE id = ?`, [id]);
        return results.length > 0 ? results[0] : null;
    },

    create: async (name) => {
        const lastRoom = dbService.query(`SELECT MAX(order_index) as max_idx FROM rooms`);
        const nextIdx = (lastRoom[0]?.max_idx || 0) + 1;

        await dbService.run(
            `INSERT INTO rooms (name, order_index) VALUES (?, ?)`,
            [name, nextIdx]
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
        // SQLite with FOREIGN KEY constraints enabled will handle cascade delete
        // We need to ensure PRAGMA foreign_keys = ON; is set on init
        return dbService.run(`DELETE FROM rooms WHERE id = ?`, [id]);
    },

    getStats: () => {
        const stats = dbService.query(`
      SELECT 
        (SELECT COUNT(*) FROM words) as total_words,
        (SELECT COUNT(*) FROM rooms WHERE is_completed = 1) as completed_rooms
    `);
        return stats[0];
    }
};
