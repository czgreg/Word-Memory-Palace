import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Play, Trophy, Edit2, Trash2 } from 'lucide-react';

const RoomList = ({ rooms, houseName, onEditRoom, onDeleteRoom, onCreateRoom }) => {
    return (
        <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {houseName ? `${houseName} 的房间` : '选择一个房子查看房间'}
                    </h2>
                    {houseName && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            共 {rooms.length} 个房间
                        </p>
                    )}
                </div>
                {houseName && (
                    <button
                        onClick={onCreateRoom}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                        + 新建房间
                    </button>
                )}
            </div>

            {!houseName ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                    <Book size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>请先从左侧选择一个房子</p>
                </div>
            ) : rooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                    <Book size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>这个房子还没有房间</p>
                    <p style={{ fontSize: '0.875rem' }}>点击上方按钮创建第一个房间</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 160px 80px',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)'
                    }}>
                        <div>房间名称</div>
                        <div>单词数</div>
                        <div>状态</div>
                        <div>快捷操作</div>
                        <div>管理</div>
                    </div>

                    {/* Table Rows */}
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 160px 80px',
                                gap: '1rem',
                                padding: '1rem',
                                background: 'var(--glass-bg)',
                                borderRadius: '0.75rem',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                            }}
                            className="hover-lift"
                        >
                            <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                                {room.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <Book size={14} />
                                <span>{room.word_count || 0}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Trophy size={14} color={room.is_completed ? 'var(--success)' : 'var(--text-muted)'} />
                                <span style={{
                                    fontSize: '0.875rem',
                                    color: room.is_completed ? 'var(--success)' : 'var(--text-muted)'
                                }}>
                                    {room.is_completed ? '已完成' : '待学习'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link
                                    to={`/room/${room.id}`}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', flex: 1, justifyContent: 'center' }}
                                >
                                    管理
                                </Link>
                                <Link
                                    to={`/room/${room.id}/learn`}
                                    className="btn btn-primary"
                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', flex: 1, justifyContent: 'center' }}
                                >
                                    <Play size={12} fill="currentColor" />
                                </Link>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => onEditRoom(room)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem', borderRadius: '0.5rem' }}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => onDeleteRoom(room.id)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem', borderRadius: '0.5rem', color: 'var(--danger)' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoomList;
