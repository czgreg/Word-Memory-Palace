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

    // 词性颜色映射：不同词性使用不同的高亮颜色
    const posColorMap = useMemo(() => ({
        noun: { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', border: '#818cf8' },  // 蓝紫色 - 名词
        n: { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', border: '#818cf8' },
        verb: { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c' },  // 橙色   - 动词
        v: { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c' },
        adjective: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80' },  // 绿色   - 形容词
        adj: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80' },
        adverb: { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)', border: '#f472b6' },  // 粉色   - 副词
        adv: { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)', border: '#f472b6' },
        pronoun: { color: '#67e8f9', bg: 'rgba(103, 232, 249, 0.15)', border: '#67e8f9' },  // 青色   - 代词
        pron: { color: '#67e8f9', bg: 'rgba(103, 232, 249, 0.15)', border: '#67e8f9' },
        preposition: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: '#fbbf24' },  // 金色   - 介词
        prep: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: '#fbbf24' },
        conjunction: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: '#a78bfa' },  // 淡紫色 - 连词
        conj: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: '#a78bfa' },
        interjection: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: '#f87171' },  // 红色   - 感叹词
        interj: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: '#f87171' },
        default: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: '#94a3b8' },  // 灰色   - 未知
    }), []);

    const getPosStyle = useCallback((pos) => {
        if (!pos) return posColorMap.default;
        const key = pos.toLowerCase().trim();
        return posColorMap[key] || posColorMap.default;
    }, [posColorMap]);

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

            // 2. Fragment rendering (Bold + Interactive Words with POS-based colors)
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

                    // Check if Word Match — 根据词性使用不同颜色
                    const w = wordMap[part.toLowerCase()];
                    if (w) {
                        const posStyle = getPosStyle(w.part_of_speech);
                        return (
                            <span
                                key={i}
                                onClick={() => speak(part)}
                                title={w.part_of_speech ? `${w.part_of_speech}: ${w.meaning}` : w.meaning}
                                style={{
                                    color: posStyle.color,
                                    fontWeight: 'bold',
                                    borderBottom: `2px solid ${posStyle.border}`,
                                    background: posStyle.bg,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    padding: '0 3px',
                                    borderRadius: '2px'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = posStyle.border;
                                    e.target.style.color = '#fff';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = posStyle.bg;
                                    e.target.style.color = posStyle.color;
                                }}
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
                                {currentWord.part_of_speech && (
                                    <span style={{
                                        fontSize: '0.9rem',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        color: 'var(--primary)',
                                        padding: '0.1rem 0.5rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '600',
                                        border: '1px solid rgba(99, 102, 241, 0.2)'
                                    }}>
                                        {currentWord.part_of_speech}
                                    </span>
                                )}
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
