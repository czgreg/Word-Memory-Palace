import initSqlJs from 'sql.js';
import { migrations } from './migrations';

const DB_NAME = 'MemoryPalaceDB';
const STORE_NAME = 'database';

class DatabaseService {
    constructor() {
        this.db = null;
        this.SQL = null;
    }

    async init() {
        if (this.db) return this.db;

        this.SQL = await initSqlJs({
            locateFile: file => `/sql-wasm.wasm`
        });

        const savedDb = await this.loadFromIndexedDB();

        if (savedDb) {
            this.db = new this.SQL.Database(new Uint8Array(savedDb));
        } else {
            this.db = new this.SQL.Database();
        }

        // 无论是否是新库,都运行一遍建表语句 (针对新表 houses)
        this.db.run(migrations);

        // 针对老数据库,手动尝试添加缺少的字段 (SQLite 不支持 ADD COLUMN IF NOT EXISTS)
        try {
            this.db.run("ALTER TABLE rooms ADD COLUMN house_id INTEGER REFERENCES houses(id) ON DELETE CASCADE;");
            console.log("已成功为 rooms 表添加 house_id 字段");
        } catch (e) { }

        try {
            this.db.run("ALTER TABLE words ADD COLUMN part_of_speech TEXT;");
            console.log("已成功为 words 表添加 part_of_speech 字段");
        } catch (e) { }

        await this.saveToIndexedDB();
        this.db.run("PRAGMA foreign_keys = ON;");
        return this.db;
    }

    async loadFromIndexedDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const getRequest = store.get('sqlite');

                getRequest.onsuccess = () => {
                    resolve(getRequest.result);
                };

                getRequest.onerror = () => resolve(null);
            };

            request.onerror = () => resolve(null);
        });
    }

    async saveToIndexedDB() {
        if (!this.db) return;

        const binaryArray = this.db.export();

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const putRequest = store.put(binaryArray, 'sqlite');

                putRequest.onsuccess = () => resolve();
                putRequest.onerror = (err) => reject(err);
            };

            request.onerror = (err) => reject(err);
        });
    }

    exec(sql, params = {}) {
        if (!this.db) throw new Error("数据库未初始化");
        return this.db.exec(sql, params);
    }

    run(sql, params = {}) {
        if (!this.db) throw new Error("数据库未初始化");
        this.db.run(sql, params);
        return this.saveToIndexedDB();
    }

    query(sql, params = {}) {
        const res = this.exec(sql, params);
        if (res.length === 0) return [];

        const columns = res[0].columns;
        return res[0].values.map(row => {
            const obj = {};
            columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });
    }
}

export const dbService = new DatabaseService();
