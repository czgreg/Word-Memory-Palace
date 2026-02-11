import { useState, useEffect } from 'react';
import { dbService } from '../db/database';

export const useDatabase = () => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                await dbService.init();
                setIsReady(true);
            } catch (err) {
                console.error("数据库连接失败:", err);
                setError(err);
            }
        };

        init();
    }, []);

    return { isReady, error, db: dbService };
};
