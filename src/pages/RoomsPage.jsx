import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { roomRepository } from '../db/repositories/roomRepository';
import RoomCard from '../components/Room/RoomCard';

const RoomsPage = () => {
    const { isReady } = useDatabase();
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const fetchRooms = async () => {
        setIsLoading(true);
        try {
            const data = await roomRepository.getAll();
            setRooms(data);
        } catch (err) {
            console.error("加载房间失败:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isReady) {
            fetchRooms();
        }
    }, [isReady]);

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exactMatch = rooms.find(room =>
        room.name.toLowerCase() === searchQuery.toLowerCase().trim()
    );

    const handleCreateRoom = async (e) => {
        if (e) e.preventDefault();
        const name = searchQuery.trim();
        if (!name || exactMatch) return;

        setIsCreating(true);
        try {
            await roomRepository.create(name);
            setSearchQuery('');
            fetchRooms();
        } catch (err) {
            console.error("创建房间失败:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm("确定要删除这个房间吗？所有单词和故事也将被删除。")) return;

        try {
            await roomRepository.delete(id);
            fetchRooms();
        } catch (err) {
            console.error("删除房间失败:", err);
        }
    };

    const handleEditRoom = (room) => {
        const newName = window.prompt("请输入新的房间名称:", room.name);
        if (newName && newName.trim() && newName !== room.name) {
            roomRepository.update(room.id, newName.trim()).then(fetchRooms);
        }
    };

    if (!isReady || isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '3rem',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>房间管理</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>查询现有房间或创建新的记忆空间</p>

                <div className="glass-card" style={{
                    padding: '0.5rem',
                    width: '100%',
                    maxWidth: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '1.25rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ paddingLeft: '1rem', color: 'var(--text-muted)' }}>
                        <Search size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="搜索房间或输入新房间名..."
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isCreating}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: '1.1rem',
                            boxShadow: 'none',
                            padding: '0.75rem 0.5rem'
                        }}
                    />
                    {searchQuery.trim() && !exactMatch && (
                        <button
                            onClick={handleCreateRoom}
                            className="btn btn-primary"
                            disabled={isCreating}
                            style={{ borderRadius: '1rem', padding: '0.6rem 1.25rem' }}
                        >
                            {isCreating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                            <span>新建房间</span>
                        </button>
                    )}
                </div>
            </div>

            {filteredRooms.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', background: 'var(--glass-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
                        }}>
                            <Search size={32} />
                        </div>
                    </div>
                    <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>
                        {searchQuery ? `未找到关于 "${searchQuery}" 的房间` : '暂无房间'}
                    </h2>
                    <p>{searchQuery ? '尝试换个关键词，或者直接点击上方按钮创建新房间。' : '开始创建你的第一个记忆房间吧！'}</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {filteredRooms.map(room => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onDelete={handleDeleteRoom}
                            onEdit={handleEditRoom}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoomsPage;
