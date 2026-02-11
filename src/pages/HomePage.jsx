import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { roomRepository } from '../db/repositories/roomRepository';
import { BookOpen, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const { isReady } = useDatabase();
    const [stats, setStats] = useState({ total_words: 0, total_rooms: 0, completed_rooms: 0 });

    useEffect(() => {
        if (isReady) {
            roomRepository.getStats().then(data => setStats(data));
        }
    }, [isReady]);

    return (
        <div className="animate-fade">
            <div style={{ padding: '2rem 0' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '900', letterSpacing: '-0.025em' }}>
                    构建你的 <span style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>单词宫殿</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', lineHeight: '1.6' }}>
                    利用世界上最强大的记忆技巧——空间记忆法。将抽象的单词转化为房间里生动的故事，让记忆持久如新。
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                        <BookOpen size={100} />
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={16} /> 掌控词汇量
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' }}>{stats.total_words}</div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>个已收录单词</div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                        <Flame size={100} />
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Flame size={16} /> 已筑房间
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' }}>{stats.total_rooms}</div>
                    <div style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>个记忆房间</div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                        <CheckCircle size={100} />
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} /> 已完成学习
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' }}>{stats.completed_rooms}</div>
                    <div style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>个已完成的房间</div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>准备好开启新的记忆旅程了吗？</h2>
                    <p style={{ color: 'var(--text-muted)' }}>前往房间管理，在这里添加并组织你的单词。</p>
                </div>
                <Link to="/rooms" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                    进入房间管理 <ArrowRight size={20} />
                </Link>
            </div>
        </div>
    );
};

export default HomePage;
