import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Volume2, ChevronLeft, ChevronRight, Trophy, BookOpen, Loader2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { roomRepository } from '../db/repositories/roomRepository';
import { wordRepository } from '../db/repositories/wordRepository';
import { storyRepository } from '../db/repositories/storyRepository';
import { useSpeech } from '../hooks/useSpeech';

const LearnPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isReady } = useDatabase();
    const { speak } = useSpeech();

    const [room, setRoom] = useState(null);
    const [words, setWords] = useState([]);
    const [story, setStory] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentWordIdx, setCurrentWordIdx] = useState(0);

    const fetchData = useCallback(async () => {
        if (!isReady) return;
        setIsLoading(true);
        try {
            const roomData = await roomRepository.getById(id);
            if (!roomData) {
                navigate('/rooms');
                return;
            }
            setRoom(roomData);

            const wordsData = await wordRepository.getByRoomId(id);
            setWords(wordsData.filter(w => w.word.trim()));

            const storyData = await storyRepository.getByRoomId(id);
            setStory(storyData?.content || '');
        } catch (err) {
            console.error("加载数据失败:", err);
        } finally {
            setIsLoading(false);
        }
    }, [id, isReady, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFinish = async () => {
        // Mark room as completed in a real app logic
        navigate(`/room/${id}/challenge`);
    };

    const wordMap = useMemo(() => {
        const map = {};
        words.forEach(w => {
            map[w.word.toLowerCase()] = w;
        });
        return map;
    }, [words]);

    const renderStory = () => {
        if (!story) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>暂无故事内容</div>;

        const validWords = words.map(w => w.word.toLowerCase());
        validWords.sort((a, b) => b.length - a.length);

        const lines = story.split('\n');

        return lines.map((line, lineIdx) => {
            let content = line;
            let style = { display: 'block', marginBottom: '0.5rem' };

            // 1. Handle Headings
            if (line.startsWith('# ')) {
                style = { ...style, fontSize: '1.75rem', fontWeight: '900', color: 'var(--accent)', marginTop: '1rem' };
                content = line.substring(2);
            } else if (line.startsWith('## ')) {
                style = { ...style, fontSize: '1.4rem', fontWeight: '800', color: 'var(--secondary)', marginTop: '0.75rem' };
                content = line.substring(3);
            } else if (line.startsWith('### ')) {
                style = { ...style, fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)', marginTop: '0.5rem' };
                content = line.substring(4);
            }

            // 2. Fragment rendering (Bold + Interactive Words)
            const renderFragments = (text) => {
                const wordRegexPart = validWords.length > 0
                    ? `|${validWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}`
                    : '';
                const regex = new RegExp(`(\\*{2}.+?\\*{2}${wordRegexPart})`, 'gi');
                const parts = text.split(regex);

                return parts.map((part, i) => {
                    // Check if Bold
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} style={{ color: 'var(--warning)' }}>{part.slice(2, -2)}</strong>;
                    }

                    // Check if Word Match
                    const w = wordMap[part.toLowerCase()];
                    if (w) {
                        return (
                            <span
                                key={i}
                                onClick={() => speak(part)}
                                style={{
                                    color: 'var(--text)',
                                    fontWeight: 'bold',
                                    borderBottom: '2px solid var(--primary)',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    padding: '0 2px'
                                }}
                                onMouseOver={(e) => e.target.style.background = 'var(--primary-glow)'}
                                onMouseOut={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.15)'}
                            >
                                {part}
                            </span>
                        );
                    }
                    return part;
                });
            };

            return (
                <div key={lineIdx} style={style}>
                    {renderFragments(content)}
                </div>
            );
        });
    };

    if (!isReady || isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const currentWord = words[currentWordIdx];

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link to={`/room/${id}`} className="btn-secondary" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>正在学习: {room?.name}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>点击故事中的单词播放发音</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem', alignItems: 'start' }}>
                {/* Story Area */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{
                        lineHeight: '2',
                        fontSize: '1.25rem',
                        whiteSpace: 'pre-wrap',
                        color: 'var(--text)',
                        letterSpacing: '0.02em'
                    }}>
                        {renderStory()}
                    </div>
                </div>

                {/* Word Detail Area */}
                <div style={{ position: 'sticky', top: '6rem' }}>
                    {words.length > 0 ? (
                        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                width: '60px', height: '60px', borderRadius: '1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                boxShadow: '0 4px 15px var(--primary-glow)'
                            }}>
                                <BookOpen size={24} color="white" />
                            </div>

                            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>{currentWord.word}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>[{currentWord.phonetic}]</span>
                                <button
                                    onClick={() => speak(currentWord.word)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem', borderRadius: '50%' }}
                                >
                                    <Volume2 size={18} />
                                </button>
                            </div>

                            <p style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{currentWord.meaning}</p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setCurrentWordIdx(prev => Math.max(0, prev - 1))}
                                    disabled={currentWordIdx === 0}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                                    {currentWordIdx + 1} / {words.length}
                                </span>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setCurrentWordIdx(prev => Math.min(words.length - 1, prev + 1))}
                                    disabled={currentWordIdx === words.length - 1}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {currentWordIdx === words.length - 1 && (
                                <button
                                    onClick={handleFinish}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}
                                >
                                    <Trophy size={18} />
                                    <span>学习完成，开始挑战</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            请先在房间管理页面录入单词
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LearnPage;
