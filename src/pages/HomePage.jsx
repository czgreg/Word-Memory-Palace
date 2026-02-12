import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { roomRepository } from '../db/repositories/roomRepository';
import { sentenceHistoryRepository } from '../db/repositories/sentenceHistoryRepository';
import { BookOpen, CheckCircle, Flame, ArrowRight, MessageSquare, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import SentenceHistoryModal from '../components/Word/SentenceHistoryModal';

const HomePage = () => {
    const { isReady } = useDatabase();
    const [stats, setStats] = useState({ total_words: 0, total_rooms: 0, completed_rooms: 0 });
    const [wordsWithHistory, setWordsWithHistory] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [sentenceHistory, setSentenceHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (isReady) {
            roomRepository.getStats().then(data => setStats(data));
            sentenceHistoryRepository.getWordsWithHistory().then(data => setWordsWithHistory(data));
        }
    }, [isReady]);

    const handleWordClick = async (word) => {
        setSelectedWord(word);
        try {
            const history = await sentenceHistoryRepository.getByWordId(word.word_id);
            setSentenceHistory(history);
        } catch (err) {
            console.error('获取造句历史失败:', err);
            setSentenceHistory([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedWord(null);
        setSentenceHistory([]);
    };

    return (
        <div>
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

            {/* 词汇造句历史区域 */}
            {wordsWithHistory.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            width: '36px', height: '36px', borderRadius: '0.75rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px var(--primary-glow)'
                        }}>
                            <History size={18} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>造句练习记录</h2>
                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                                点击单词查看造句历史和 AI 评价
                            </p>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '1rem'
                    }}>
                        {wordsWithHistory.map((item) => (
                            <div
                                key={item.word_id}
                                className="glass-card"
                                onClick={() => handleWordClick(item)}
                                style={{
                                    padding: '1.25rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.15)';
                                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '';
                                    e.currentTarget.style.borderColor = '';
                                }}
                            >
                                {/* 句子数量角标 */}
                                <div style={{
                                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '1rem',
                                    display: 'flex', alignItems: 'center', gap: '0.25rem'
                                }}>
                                    <MessageSquare size={10} />
                                    {item.sentence_count}
                                </div>

                                <div style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                                    {item.word}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    {item.phonetic && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            [{item.phonetic}]
                                        </span>
                                    )}
                                    {item.part_of_speech && (
                                        <span style={{
                                            fontSize: '0.7rem',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            color: 'var(--primary)',
                                            padding: '0.05rem 0.4rem',
                                            borderRadius: '0.4rem',
                                            fontWeight: '600'
                                        }}>
                                            {item.part_of_speech}
                                        </span>
                                    )}
                                </div>

                                <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                                    {item.meaning}
                                </div>

                                {item.room_name && (
                                    <div style={{
                                        fontSize: '0.75rem', color: 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                                    }}>
                                        📍 {item.room_name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>准备好开启新的记忆旅程了吗？</h2>
                    <p style={{ color: 'var(--text-muted)' }}>前往房间管理，在这里添加并组织你的单词。</p>
                </div>
                <Link to="/rooms" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                    进入房间管理 <ArrowRight size={20} />
                </Link>
            </div>

            {/* 造句历史弹窗 */}
            <SentenceHistoryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                wordData={selectedWord}
                history={sentenceHistory}
            />
        </div>
    );
};

export default HomePage;
