import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Play, Trophy, Trash2, Edit2 } from 'lucide-react';

const RoomCard = ({ room, onDelete, onEdit }) => {
    return (
        <div className="glass-card animate-fade" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'transform 0.3s ease',
            cursor: 'default'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>
                    {room.name}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => onEdit(room)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem', borderRadius: '0.5rem' }}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(room.id)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem', borderRadius: '0.5rem', color: 'var(--danger)' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Book size={14} />
                    <span>{room.word_count || 0} 单词</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Trophy size={14} />
                    <span>{room.is_completed ? '已完成' : '待学习'}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Link to={`/room/${room.id}`} className="btn btn-secondary" style={{ justifyContent: 'center', fontSize: '0.875rem' }}>
                    管理词汇
                </Link>
                <Link to={`/room/${room.id}/learn`} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: '0.875rem' }}>
                    <Play size={14} fill="currentColor" />
                    开始学习
                </Link>
            </div>
        </div>
    );
};

export default RoomCard;
