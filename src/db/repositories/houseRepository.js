import { dbService } from '../database';

export const houseRepository = {
    getAll: async () => {
        return dbService.query(`
      SELECT h.*, COUNT(r.id) as room_count 
      FROM houses h 
      LEFT JOIN rooms r ON h.id = r.house_id 
      GROUP BY h.id 
      ORDER BY h.order_index ASC
    `);
    },

    getById: async (id) => {
        const results = await dbService.query(`SELECT * FROM houses WHERE id = ?`, [id]);
        return results.length > 0 ? results[0] : null;
    },

    create: async (name) => {
        const lastHouse = await dbService.query(`SELECT MAX(order_index) as max_idx FROM houses`);
        const nextIdx = (lastHouse[0]?.max_idx || 0) + 1;

        const result = await dbService.run(
            `INSERT INTO houses (name, order_index) VALUES (?, ?)`,
            [name, nextIdx]
        );

        return result.lastInsertRowid;
    },

    update: async (id, name) => {
        return dbService.run(
            `UPDATE houses SET name = ? WHERE id = ?`,
            [name, id]
        );
    },

    delete: async (id) => {
        const rooms = await dbService.query(`SELECT id FROM rooms WHERE house_id = ?`, [id]);
        const statements = [];
        for (const room of rooms) {
            statements.push({ sql: `DELETE FROM words WHERE room_id = ?`, params: [room.id] });
            statements.push({ sql: `DELETE FROM stories WHERE room_id = ?`, params: [room.id] });
            statements.push({ sql: `DELETE FROM challenges WHERE room_id = ?`, params: [room.id] });
        }
        statements.push({ sql: `DELETE FROM rooms WHERE house_id = ?`, params: [id] });
        statements.push({ sql: `DELETE FROM houses WHERE id = ?`, params: [id] });
        return dbService.runBatch(statements);
    }
};
