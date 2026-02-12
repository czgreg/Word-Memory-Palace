import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';
import { wordbookRepository } from '../db/repositories/wordbookRepository';
import { ArrowLeft, Check, X, Zap, Building2, Eye } from 'lucide-react';

function FlashReviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isReady } = useDatabase();

    const [wordbook, setWordbook] = useState(null);
    const [batch, setBatch] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [roundStats, setRoundStats] = useState({ known: 0, unknown: 0 });
    const [unknownTotal, setUnknownTotal] = useState(0);
    const [roundComplete, setRoundComplete] = useState(false);
    const [allDone, setAllDone] = useState(false);
    const [round, setRound] = useState(1);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (isReady && id) loadData();
    }, [isReady, id]);

    const loadData = async () => {
        try {
            const wb = await wordbookRepository.getById(id);
            setWordbook(wb);
            const unknownCount = await wordbookRepository.getUnknownCount(id);
            setUnknownTotal(unknownCount);
            await loadNextBatch();
        } catch (err) {
            console.error('加载失败:', err);
        } finally {
            setReady(true);
        }
    };

    const loadNextBatch = async () => {
        const entries = await wordbookRepository.getUnreviewedBatch(id, 50);
        if (entries.length === 0) {
            setAllDone(true);
            setBatch([]);
        } else {
            setBatch(entries);
            setCurrentIndex(0);
            setFlipped(false);
            setRoundStats({ known: 0, unknown: 0 });
            setRoundComplete(false);
        }
    };

    const handleMark = async (isKnown) => {
        const entry = batch[currentIndex];
        if (!entry) return;

        try {
            await wordbookRepository.markEntry(entry.id, isKnown, round);

            const newStats = { ...roundStats };
            if (isKnown) {
                newStats.known++;
            } else {
                newStats.unknown++;
                setUnknownTotal(prev => prev + 1);
            }
            setRoundStats(newStats);

            if (currentIndex < batch.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setFlipped(false);
            } else {
                setRoundComplete(true);
            }
        } catch (err) {
            console.error('标记失败:', err);
        }
    };

    const handleNextRound = async () => {
        setRound(prev => prev + 1);
        await loadNextBatch();
    };

    const currentWord = batch[currentIndex];
    const progress = batch.length > 0 ? ((currentIndex + (roundComplete ? 1 : 0)) / batch.length * 100) : 0;

    return (
        <div style={{ minHeight: '70vh' }}>
            {/* Header — always visible, prevents layout shift */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/wordbooks" className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                            ⚡ 快刷模式
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {wordbook?.name || '加载中...'} · 第 {round} 轮
                        </p>
                    </div>
                </div>

                {/* Unknown count badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: unknownTotal >= 50 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${unknownTotal >= 50 ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)'}`,
                        borderRadius: '1rem', padding: '0.5rem 1rem',
                        fontSize: '0.875rem', fontWeight: '600',
                        color: unknownTotal >= 50 ? 'var(--danger)' : 'var(--text-muted)'
                    }}>
                        ❌ 不认识: {unknownTotal}
                    </div>
                    {unknownTotal >= 50 && (
                        <button
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClick={() => navigate(`/wordbook/${id}/build-palace`)}
                        >
                            <Building2 size={16} /> 构建记忆宫殿
                        </button>
                    )}
                </div>
            </div>

            {!ready ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
                </div>
            ) : (
                <>
                    {/* Progress Bar */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                            height: '8px', borderRadius: '4px',
                            background: 'rgba(255,255,255,0.08)', overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%', borderRadius: '4px',
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem'
                        }}>
                            <span>{batch.length > 0 ? `第 ${currentIndex + 1} / ${batch.length} 词` : '-'}</span>
                            <span>✅ {roundStats.known}  ❌ {roundStats.unknown}</span>
                        </div>
                    </div>

                    {allDone ? (
                        /* All Done */
                        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>全部刷完了！</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                累计不认识词数: <strong style={{ color: 'var(--danger)' }}>{unknownTotal}</strong>
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                {unknownTotal >= 50 && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => navigate(`/wordbook/${id}/build-palace`)}
                                    >
                                        <Building2 size={18} /> 构建记忆宫殿
                                    </button>
                                )}
                                <Link to="/wordbooks" className="btn btn-secondary">
                                    返回单词本
                                </Link>
                            </div>
                        </div>
                    ) : roundComplete ? (
                        /* Round Complete */
                        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>本组完成！</h2>
                            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem' }}>
                                <div style={{
                                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: '1rem', padding: '1.5rem 2rem', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)' }}>{roundStats.known}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>认识</div>
                                </div>
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '1rem', padding: '1.5rem 2rem', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--danger)' }}>{roundStats.unknown}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>不认识</div>
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={handleNextRound}>
                                <Zap size={18} /> 继续下一组
                            </button>
                        </div>
                    ) : currentWord ? (
                        /* Flash Card */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div
                                className="glass-card"
                                style={{
                                    width: '100%', maxWidth: '500px', height: '300px',
                                    padding: '3rem', textAlign: 'center',
                                    cursor: 'pointer', userSelect: 'none',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    border: flipped ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--surface-border)'
                                }}
                                onClick={() => setFlipped(!flipped)}
                            >
                                {!flipped ? (
                                    <>
                                        <div style={{
                                            fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem',
                                            letterSpacing: '-0.025em'
                                        }}>
                                            {currentWord.word}
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            color: 'var(--text-muted)', fontSize: '0.875rem'
                                        }}>
                                            <Eye size={14} /> 点击翻面查看释义
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{
                                            fontSize: '2rem', fontWeight: '800', marginBottom: '1rem',
                                            color: 'var(--primary)'
                                        }}>
                                            {currentWord.word}
                                        </div>
                                        {currentWord.part_of_speech && (
                                            <div style={{
                                                color: 'var(--secondary)', fontSize: '1rem',
                                                marginBottom: '0.75rem', fontStyle: 'italic'
                                            }}>
                                                {currentWord.part_of_speech}
                                            </div>
                                        )}
                                        <div style={{
                                            fontSize: '1.25rem', color: 'var(--text)',
                                            lineHeight: 1.6
                                        }}>
                                            {currentWord.meaning}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
                                <button
                                    onClick={() => handleMark(false)}
                                    style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        border: '2px solid rgba(239, 68, 68, 0.4)',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: 'var(--danger)', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', gap: '4px',
                                        transition: 'all 0.2s ease', fontSize: '0.75rem', fontWeight: '600'
                                    }}
                                >
                                    <X size={28} />
                                    不认识
                                </button>
                                <button
                                    onClick={() => handleMark(true)}
                                    style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        border: '2px solid rgba(16, 185, 129, 0.4)',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--success)', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', gap: '4px',
                                        transition: 'all 0.2s ease', fontSize: '0.75rem', fontWeight: '600'
                                    }}
                                >
                                    <Check size={28} />
                                    认识
                                </button>
                            </div>

                            {/* Keyboard hint */}
                            <div style={{
                                marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)',
                                display: 'flex', gap: '1.5rem'
                            }}>
                                <span>空格：翻面</span>
                                <span>← 不认识</span>
                                <span>→ 认识</span>
                            </div>
                        </div>
                    ) : null}
                </>
            )}

            {/* Keyboard Support */}
            <KeyboardHandler
                onFlip={() => setFlipped(f => !f)}
                onKnown={() => !roundComplete && !allDone && ready && handleMark(true)}
                onUnknown={() => !roundComplete && !allDone && ready && handleMark(false)}
            />
        </div>
    );
}

function KeyboardHandler({ onFlip, onKnown, onUnknown }) {
    useEffect(() => {
        const handler = (e) => {
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onFlip(); }
            else if (e.key === 'ArrowRight' || e.key === 'l') { onKnown(); }
            else if (e.key === 'ArrowLeft' || e.key === 'h') { onUnknown(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onFlip, onKnown, onUnknown]);
    return null;
}

export default FlashReviewPage;
