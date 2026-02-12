import React from 'react';
import { X, MessageSquare, Clock, Sparkles } from 'lucide-react';

const SentenceHistoryModal = ({ isOpen, onClose, wordData, history }) => {
    if (!isOpen || !wordData) return null;

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2rem',
                animation: 'fadeIn 0.2s ease'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '1.25rem',
                    width: '100%',
                    maxWidth: '680px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                    animation: 'slideUp 0.3s ease'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexShrink: 0
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.25rem' }}>
                            {wordData.word}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {wordData.phonetic && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                    [{wordData.phonetic}]
                                </span>
                            )}
                            {wordData.part_of_speech && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)',
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    border: '1px solid rgba(99, 102, 241, 0.2)'
                                }}>
                                    {wordData.part_of_speech}
                                </span>
                            )}
                            <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                                {wordData.meaning}
                            </span>
                        </div>
                        {wordData.room_name && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                📍 {wordData.room_name}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '0.5rem',
                            padding: '0.4rem',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    padding: '1.5rem 2rem',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                            <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>暂无造句记录</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{
                                fontSize: '0.85rem', color: 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                marginBottom: '0.25rem'
                            }}>
                                <MessageSquare size={14} />
                                共 {history.length} 条造句记录
                            </div>
                            {history.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    style={{
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.75rem',
                                        padding: '1.25rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {/* Sentence */}
                                    <div style={{
                                        fontSize: '1rem',
                                        lineHeight: '1.6',
                                        marginBottom: '0.75rem',
                                        fontStyle: 'italic',
                                        color: 'var(--text)'
                                    }}>
                                        "{item.sentence}"
                                    </div>

                                    {/* AI Review */}
                                    {item.review && (
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '0.5rem',
                                            background: 'rgba(99, 102, 241, 0.05)',
                                            border: '1px solid rgba(99, 102, 241, 0.12)',
                                            fontSize: '0.85rem',
                                            lineHeight: '1.6',
                                            color: 'var(--text)',
                                            whiteSpace: 'pre-wrap',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                marginBottom: '0.4rem', fontWeight: '700',
                                                color: 'var(--primary)', fontSize: '0.8rem'
                                            }}>
                                                <Sparkles size={12} /> AI 点评
                                            </div>
                                            {item.review}
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                                        fontSize: '0.75rem', color: 'var(--text-muted)'
                                    }}>
                                        <Clock size={12} />
                                        {formatDate(item.created_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default SentenceHistoryModal;
