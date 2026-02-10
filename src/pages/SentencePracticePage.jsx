import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trophy, Loader2, Send, Settings, CheckCircle2, AlertTriangle, XCircle, BookOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { wordRepository } from '../db/repositories/wordRepository';
import { roomRepository } from '../db/repositories/roomRepository';
import { aiService } from '../utils/aiService';
import { useSpeech } from '../hooks/useSpeech';

const REQUIRED_SENTENCES = 3;

// ========== AI 配置面板 ==========
const AIConfigPanel = ({ config, onSave, collapsed, onToggle }) => {
    const [form, setForm] = useState(config);
    const [ollamaOk, setOllamaOk] = useState(null);

    useEffect(() => {
        aiService.checkOllamaAvailable().then(setOllamaOk);
    }, []);

    const handleSave = () => {
        onSave(form);
        onToggle();
    };

    return (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div
                onClick={onToggle}
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem 1.5rem', cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} />
                    <span style={{ fontWeight: '600' }}>AI 设置</span>
                    <span style={{
                        fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '1rem',
                        background: aiService.isConfigured() ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: aiService.isConfigured() ? 'var(--success)' : 'var(--danger)'
                    }}>
                        {aiService.isConfigured() ? '已配置' : '未配置'}
                    </span>
                </div>
                {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>

            {!collapsed && (
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    {/* Mode Switch */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {[
                            { id: 'local', label: '本地模型 (Ollama)', status: ollamaOk },
                            { id: 'remote', label: '远程 API' }
                        ].map(m => (
                            <button
                                key={m.id}
                                className={form.mode === m.id ? 'btn btn-primary' : 'btn btn-secondary'}
                                style={{ flex: 1, padding: '0.75rem' }}
                                onClick={() => setForm(f => ({ ...f, mode: m.id }))}
                            >
                                {m.label}
                                {m.id === 'local' && ollamaOk !== null && (
                                    <span style={{
                                        fontSize: '0.7rem', marginLeft: '0.5rem',
                                        color: ollamaOk ? 'var(--success)' : 'var(--danger)'
                                    }}>
                                        {ollamaOk ? '● 在线' : '● 离线'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {form.mode === 'local' ? (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>模型名称</label>
                            <input
                                className="input-field"
                                value={form.localModel}
                                onChange={e => setForm(f => ({ ...f, localModel: e.target.value }))}
                                placeholder="例如 qwen3-4b"
                                style={{ width: '100%', marginBottom: '1rem' }}
                            />
                            {!ollamaOk && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '1rem' }}>
                                    ⚠️ Ollama 未运行。请先安装并启动：<code>brew install ollama && ollama serve</code>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* 预设快速选择 */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>快速选择</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
                                        { label: '通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus' },
                                        { label: 'DeepSeek', url: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
                                    ].map(preset => (
                                        <button
                                            key={preset.label}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                            onClick={() => setForm(f => ({ ...f, remoteUrl: preset.url, remoteModel: preset.model }))}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>API 地址</label>
                                <input
                                    className="input-field"
                                    value={form.remoteUrl}
                                    onChange={e => setForm(f => ({ ...f, remoteUrl: e.target.value }))}
                                    placeholder="https://api.openai.com/v1/chat/completions"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>API Key</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={form.remoteKey}
                                    onChange={e => setForm(f => ({ ...f, remoteKey: e.target.value }))}
                                    placeholder="sk-..."
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>模型名称</label>
                                <input
                                    className="input-field"
                                    value={form.remoteModel}
                                    onChange={e => setForm(f => ({ ...f, remoteModel: e.target.value }))}
                                    placeholder="gpt-4o-mini"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    )}

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} onClick={handleSave}>
                        保存配置
                    </button>
                </div>
            )}
        </div>
    );
};

// ========== 单个造句输入卡片 ==========
const SentenceCard = ({ index, word, meaning, partOfSpeech, sentence, review, isReviewing, onSentenceChange, onReview }) => (
    <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{
                background: review
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(99, 102, 241, 0.15)',
                color: review ? 'var(--success)' : 'var(--primary)',
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '0.875rem'
            }}>
                {review ? <CheckCircle2 size={16} /> : index + 1}
            </span>
            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                第 {index + 1} 个句子
            </span>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
            <textarea
                className="input-field"
                style={{
                    width: '100%', fontSize: '1rem', padding: '0.75rem',
                    minHeight: '80px', resize: 'vertical', lineHeight: '1.6',
                    fontFamily: 'inherit'
                }}
                placeholder={`用 "${word}" 造一个英文句子...`}
                value={sentence}
                onChange={e => onSentenceChange(e.target.value)}
                disabled={isReviewing}
                rows={2}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}
                    onClick={onReview}
                    disabled={!sentence.trim() || isReviewing}
                >
                    {isReviewing ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> AI 点评</>}
                </button>
            </div>
        </div>

        {review && (
            <div style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: 'var(--text)',
                whiteSpace: 'pre-wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                    <Sparkles size={14} /> AI 点评
                </div>
                {review}
            </div>
        )}
    </div>
);


// ========== 主页面 ==========
const SentencePracticePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isReady } = useDatabase();
    const { speak } = useSpeech();

    const [room, setRoom] = useState(null);
    const [words, setWords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentWordIdx, setCurrentWordIdx] = useState(0);

    // 每个单词对应3个句子 和 3个点评
    // sentenceData: { [wordIdx]: { sentences: [str, str, str], reviews: [str|null, ...], reviewing: [bool, ...] } }
    const [sentenceData, setSentenceData] = useState({});

    const [configCollapsed, setConfigCollapsed] = useState(true);
    const [aiConfig, setAiConfig] = useState(aiService.getConfig());
    const [gameState, setGameState] = useState('practice'); // 'practice' | 'complete'

    // Load data
    useEffect(() => {
        if (!isReady) return;
        const load = async () => {
            try {
                const roomData = await roomRepository.getById(id);
                if (!roomData) { navigate('/rooms'); return; }
                setRoom(roomData);

                const wordsData = await wordRepository.getByRoomId(id);
                const activeWords = wordsData.filter(w => w.word.trim());
                setWords(activeWords);

                // Initialize sentence data
                const init = {};
                activeWords.forEach((_, i) => {
                    init[i] = {
                        sentences: ['', '', ''],
                        reviews: [null, null, null],
                        reviewing: [false, false, false],
                    };
                });
                setSentenceData(init);
            } catch (err) {
                console.error('加载数据失败:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id, isReady, navigate]);

    const currentWord = words[currentWordIdx];
    const currentData = sentenceData[currentWordIdx] || { sentences: ['', '', ''], reviews: [null, null, null], reviewing: [false, false, false] };

    const reviewedCount = currentData.reviews.filter(r => r !== null).length;
    const canGoNext = reviewedCount >= REQUIRED_SENTENCES;
    const isLastWord = currentWordIdx === words.length - 1;

    // 总体进度
    const totalReviewed = useMemo(() => {
        return Object.values(sentenceData).reduce((sum, d) => sum + d.reviews.filter(r => r !== null).length, 0);
    }, [sentenceData]);
    const totalRequired = words.length * REQUIRED_SENTENCES;

    const handleSentenceChange = (sentIdx, value) => {
        setSentenceData(prev => {
            const copy = { ...prev };
            copy[currentWordIdx] = {
                ...copy[currentWordIdx],
                sentences: copy[currentWordIdx].sentences.map((s, i) => i === sentIdx ? value : s),
            };
            return copy;
        });
    };

    const handleReview = async (sentIdx) => {
        if (!aiService.isConfigured()) {
            setConfigCollapsed(false);
            return;
        }

        const sentence = currentData.sentences[sentIdx];
        if (!sentence.trim()) return;

        // Set reviewing
        setSentenceData(prev => {
            const copy = { ...prev };
            copy[currentWordIdx] = {
                ...copy[currentWordIdx],
                reviewing: copy[currentWordIdx].reviewing.map((r, i) => i === sentIdx ? true : r),
            };
            return copy;
        });

        try {
            const review = await aiService.reviewSentence(
                currentWord.word,
                currentWord.meaning,
                currentWord.part_of_speech,
                sentence
            );

            setSentenceData(prev => {
                const copy = { ...prev };
                copy[currentWordIdx] = {
                    ...copy[currentWordIdx],
                    reviews: copy[currentWordIdx].reviews.map((r, i) => i === sentIdx ? review : r),
                    reviewing: copy[currentWordIdx].reviewing.map((r, i) => i === sentIdx ? false : r),
                };
                return copy;
            });
        } catch (err) {
            console.error('AI 点评失败:', err);
            setSentenceData(prev => {
                const copy = { ...prev };
                copy[currentWordIdx] = {
                    ...copy[currentWordIdx],
                    reviews: copy[currentWordIdx].reviews.map((r, i) => i === sentIdx ? `❌ 点评失败: ${err.message}` : r),
                    reviewing: copy[currentWordIdx].reviewing.map((r, i) => i === sentIdx ? false : r),
                };
                return copy;
            });
        }
    };

    const handleNext = () => {
        if (isLastWord) {
            setGameState('complete');
        } else {
            setCurrentWordIdx(i => i + 1);
        }
    };

    const handlePrev = () => {
        setCurrentWordIdx(i => Math.max(0, i - 1));
    };

    const handleSaveConfig = (cfg) => {
        aiService.saveConfig(cfg);
        setAiConfig(cfg);
    };

    // ===== Render =====

    if (isLoading || !isReady) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={32} /></div>;
    }

    if (words.length === 0) {
        return (
            <div className="animate-fade" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
                <div className="glass-card" style={{ padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>该房间没有单词，无法进行造句练习。</p>
                    <button className="btn btn-primary" onClick={() => navigate(`/room/${id}`)}>返回房间</button>
                </div>
            </div>
        );
    }

    // ---- 完成页面 ----
    if (gameState === 'complete') {
        return (
            <div className="animate-fade" style={{ maxWidth: '600px', margin: '4rem auto' }}>
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        width: '80px', height: '80px', borderRadius: '1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 2rem',
                        boxShadow: '0 8px 25px var(--primary-glow)'
                    }}>
                        <Trophy size={40} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>造句练习完成！</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        你已为 <strong>{words.length}</strong> 个单词完成了造句练习
                    </p>
                    <p style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '2rem' }}>
                        {totalReviewed} / {totalRequired} 句
                    </p>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={() => navigate(`/room/${id}/learn`)}>
                            返回学习
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} onClick={() => navigate(`/room/${id}/challenge`)}>
                            <Trophy size={18} />
                            <span>进入挑战</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- 练习页面 ----
    return (
        <div className="animate-fade" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => navigate(`/room/${id}/learn`)} style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ margin: 0 }}>造句练习: {room?.name}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>为每个单词造至少 {REQUIRED_SENTENCES} 个句子，AI 帮你纠错点评</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <span>单词 {currentWordIdx + 1} / {words.length}</span>
                    <span>总进度 {totalReviewed} / {totalRequired} 句</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--glass-border)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: '3px',
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                        width: `${totalRequired > 0 ? (totalReviewed / totalRequired) * 100 : 0}%`,
                        transition: 'width 0.5s ease'
                    }} />
                </div>
            </div>

            {/* AI Config */}
            <AIConfigPanel
                config={aiConfig}
                onSave={handleSaveConfig}
                collapsed={configCollapsed}
                onToggle={() => setConfigCollapsed(c => !c)}
            />

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Left: Word Card */}
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', position: 'sticky', top: '6rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        width: '56px', height: '56px', borderRadius: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 4px 15px var(--primary-glow)'
                    }}>
                        <BookOpen size={24} color="white" />
                    </div>

                    <h2
                        style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '0.5rem', cursor: 'pointer' }}
                        onClick={() => speak(currentWord.word)}
                    >
                        {currentWord.word}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {currentWord.phonetic && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>[{currentWord.phonetic}]</span>
                        )}
                        {currentWord.part_of_speech && (
                            <span style={{
                                fontSize: '0.8rem',
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
                    </div>

                    <p style={{ fontSize: '1.3rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1.5rem' }}>{currentWord.meaning}</p>

                    {/* Word Progress Dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {words.map((_, i) => {
                            const d = sentenceData[i];
                            const done = d && d.reviews.filter(r => r !== null).length >= REQUIRED_SENTENCES;
                            return (
                                <div
                                    key={i}
                                    onClick={() => setCurrentWordIdx(i)}
                                    style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: i === currentWordIdx
                                            ? 'var(--primary)'
                                            : done ? 'var(--success)' : 'var(--glass-border)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        transform: i === currentWordIdx ? 'scale(1.3)' : 'scale(1)',
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Nav Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={handlePrev} disabled={currentWordIdx === 0} style={{ flex: 1 }}>
                            <ArrowLeft size={16} /> 上一个
                        </button>
                        <button
                            className={canGoNext ? 'btn btn-primary' : 'btn btn-secondary'}
                            onClick={handleNext}
                            disabled={!canGoNext}
                            style={{ flex: 1 }}
                        >
                            {isLastWord ? '完成' : '下一个'} <ArrowRight size={16} />
                        </button>
                    </div>
                    {!canGoNext && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                            还需完成 {REQUIRED_SENTENCES - reviewedCount} 个句子的 AI 点评
                        </p>
                    )}
                </div>

                {/* Right: Sentence Input Area */}
                <div>
                    {[0, 1, 2].map(sentIdx => (
                        <SentenceCard
                            key={`${currentWordIdx}-${sentIdx}`}
                            index={sentIdx}
                            word={currentWord.word}
                            meaning={currentWord.meaning}
                            partOfSpeech={currentWord.part_of_speech}
                            sentence={currentData.sentences[sentIdx]}
                            review={currentData.reviews[sentIdx]}
                            isReviewing={currentData.reviewing[sentIdx]}
                            onSentenceChange={val => handleSentenceChange(sentIdx, val)}
                            onReview={() => handleReview(sentIdx)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SentencePracticePage;
