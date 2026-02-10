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
        // 级联删除所有房间和相关数据
        return dbService.run(`DELETE FROM houses WHERE id = ?`, [id]);
    }
};
