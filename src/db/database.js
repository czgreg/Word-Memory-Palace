const API_BASE = '/api/db';

class DatabaseService {
    constructor() {
        this._ready = false;
    }

    async init() {
        if (this._ready) return;

        try {
            const res = await fetch('/api/health');
            if (!res.ok) throw new Error('后端服务未响应');
            this._ready = true;
        } catch (err) {
            throw new Error(`无法连接后端服务: ${err.message}`);
        }
    }

    async query(sql, params = []) {
        const res = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql, params })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '查询失败');
        }

        const data = await res.json();
        return data.rows;
    }

    async run(sql, params = []) {
        const res = await fetch(`${API_BASE}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql, params })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '执行失败');
        }

        return res.json();
    }

    async runBatch(statements) {
        const res = await fetch(`${API_BASE}/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statements })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '批量执行失败');
        }

        return res.json();
    }
}

export const dbService = new DatabaseService();
