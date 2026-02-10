import { dbService } from '../database';

export const houseRepository = {
    getAll: () => {
        return dbService.query(`
      SELECT h.*, COUNT(r.id) as room_count 
      FROM houses h 
      LEFT JOIN rooms r ON h.id = r.house_id 
      GROUP BY h.id 
      ORDER BY h.order_index ASC
    `);
    },

    getById: (id) => {
        const results = dbService.query(`SELECT * FROM houses WHERE id = ?`, [id]);
        return results.length > 0 ? results[0] : null;
    },

    create: async (name) => {
        const lastHouse = dbService.query(`SELECT MAX(order_index) as max_idx FROM houses`);
        const nextIdx = (lastHouse[0]?.max_idx || 0) + 1;

        await dbService.run(
            `INSERT INTO houses (name, order_index) VALUES (?, ?)`,
            [name, nextIdx]
        );

        const res = dbService.query(`SELECT last_insert_rowid() as id`);
        return res[0].id;
    },

    update: async (id, name) => {
        return dbService.run(
            `UPDATE houses SET name = ? WHERE id = ?`,
            [name, id]
        );
    },

    delete: async (id) => {
        // sql.js 的 PRAGMA foreign_keys 不可靠，手动级联删除
        const rooms = dbService.query(`SELECT id FROM rooms WHERE house_id = ?`, [id]);
        for (const room of rooms) {
            dbService.db.run(`DELETE FROM words WHERE room_id = ?`, [room.id]);
            dbService.db.run(`DELETE FROM stories WHERE room_id = ?`, [room.id]);
            dbService.db.run(`DELETE FROM challenges WHERE room_id = ?`, [room.id]);
        }
        dbService.db.run(`DELETE FROM rooms WHERE house_id = ?`, [id]);
        return dbService.run(`DELETE FROM houses WHERE id = ?`, [id]);
    }
};
