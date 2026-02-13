import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';
import { wordbookRepository } from '../db/repositories/wordbookRepository';
import { houseRepository } from '../db/repositories/houseRepository';
import { roomRepository } from '../db/repositories/roomRepository';
import { wordRepository } from '../db/repositories/wordRepository';
import { storyRepository } from '../db/repositories/storyRepository';
import { aiService } from '../utils/aiService';
import { ArrowLeft, Wand2, Loader2, Check, BookOpen, RefreshCw, Save, ChevronDown, ChevronUp } from 'lucide-react';

function PalaceBuildPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isReady } = useDatabase();

    const [wordbook, setWordbook] = useState(null);
    const [unknownWords, setUnknownWords] = useState([]);
    const [step, setStep] = useState('preview'); // preview -> grouping -> stories -> done
    const [groups, setGroups] = useState([]);
    const [stories, setStories] = useState({}); // roomIndex -> story content
    const [loading, setLoading] = useState(false);
    const [currentStoryIdx, setCurrentStoryIdx] = useState(-1);
    const [error, setError] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isReady && id) loadData();
    }, [isReady, id]);

    const loadData = async () => {
        try {
            const wb = await wordbookRepository.getById(id);
            setWordbook(wb);
            const words = await wordbookRepository.getUnknownWords(id);
            // 取前 50 个
            setUnknownWords(words.slice(0, 50));
        } catch (err) {
            console.error('加载失败:', err);
        }
    };

    const handleGrouping = async () => {
        if (!aiService.isConfigured()) {
            setError('请先在设置中配置 AI API');
            return;
        }
        setLoading(true);
        setError('');
        setStep('grouping');
        try {
            const wordsForAI = unknownWords.map(w => ({
                word: w.word,
                part_of_speech: w.part_of_speech || '',
                meaning: w.meaning
            }));
            const result = await aiService.groupWordsBySemantic(wordsForAI);
            setGroups(result);
            // 自动展开所有分组
            const expanded = {};
            result.forEach((_, i) => { expanded[i] = true; });
            setExpandedGroups(expanded);
        } catch (err) {
            setError('AI 分组失败: ' + err.message);
            setStep('preview');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateStories = async () => {
        setStep('stories');
        setLoading(true);
        setError('');

        const newStories = { ...stories };
        for (let i = 0; i < groups.length; i++) {
            setCurrentStoryIdx(i);
            try {
                const story = await aiService.generateRoomStory(groups[i].roomName, groups[i].words);
                newStories[i] = story;
                setStories({ ...newStories });
            } catch (err) {
                newStories[i] = `⚠️ 生成失败: ${err.message}`;
                setStories({ ...newStories });
            }
        }
        setCurrentStoryIdx(-1);
        setLoading(false);
        setStep('done');
    };

    const handleRegenerateStory = async (index) => {
        setCurrentStoryIdx(index);
        try {
            const story = await aiService.generateRoomStory(groups[index].roomName, groups[index].words);
            setStories(prev => ({ ...prev, [index]: story }));
        } catch (err) {
            setStories(prev => ({ ...prev, [index]: `⚠️ 重新生成失败: ${err.message}` }));
        }
        setCurrentStoryIdx(-1);
    };

    const handleSaveToPalace = async () => {
        setSaving(true);
        setError('');
        try {
            const today = new Date().toLocaleDateString('zh-CN');
            const houseName = `${wordbook?.name || '单词本'} - ${today}`;
            const houseId = await houseRepository.create(houseName);

            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                const roomId = await roomRepository.create(group.roomName, houseId);

                // 写入单词
                for (let j = 0; j < group.words.length; j++) {
                    const w = group.words[j];
                    await wordRepository.upsert(null, roomId, w.word, '', w.part_of_speech, w.meaning, j);
                }

                // 写入故事
                if (stories[i]) {
                    await storyRepository.upsert(roomId, stories[i]);
                }
            }

            // 标记这批不认识的词为已处理
            const entryIds = unknownWords.map(w => w.id);
            await wordbookRepository.clearUnknownWords(id, entryIds);

            alert('✅ 记忆宫殿构建完成！已写入房间管理。');
            navigate('/rooms');
        } catch (err) {
            setError('写入失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleGroup = (index) => {
        setExpandedGroups(prev => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <div className="animate-fade">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link to={`/wordbook/${id}/review`} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>🏠 构建记忆宫殿</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {wordbook?.name} · {unknownWords.length} 个不认识的单词
                    </p>
                </div>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem',
                    color: 'var(--danger)', fontSize: '0.875rem'
                }}>
                    {error}
                </div>
            )}

            {/* Steps Indicator */}
            <div style={{
                display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center'
            }}>
                {[
                    { key: 'preview', label: '① 预览单词' },
                    { key: 'grouping', label: '② AI 分组' },
                    { key: 'stories', label: '③ AI 故事' },
                    { key: 'done', label: '④ 写入宫殿' },
                ].map(({ key, label }) => (
                    <div key={key} style={{
                        padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '600',
                        background: step === key ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.05)',
                        color: step === key ? 'white' : 'var(--text-muted)',
                        border: `1px solid ${step === key ? 'transparent' : 'var(--glass-border)'}`,
                        transition: 'all 0.3s ease'
                    }}>
                        {label}
                    </div>
                ))}
            </div>

            {/* Step: Preview */}
            {step === 'preview' && (
                <div>
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontWeight: '700' }}>待构建的单词（{unknownWords.length} 个）</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {unknownWords.map(w => (
                                <span key={w.id} style={{
                                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                                    borderRadius: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                }}>
                                    <strong>{w.word}</strong>
                                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>{w.meaning}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <button className="btn btn-primary" onClick={handleGrouping} disabled={loading} style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                            {loading ? (<><Loader2 size={20} className="spin" /> AI 分组中...</>) : (<><Wand2 size={20} /> 开始 AI 语义分组</>)}
                        </button>
                    </div>
                </div>
            )}

            {/* Grouping Progress */}
            {step === 'grouping' && loading && (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: '600', marginBottom: '0.75rem' }}>AI 正在分析 {unknownWords.length} 个单词的语义关系…</p>
                    <div style={{
                        width: '100%', maxWidth: '400px', margin: '0 auto',
                        height: '6px', borderRadius: '3px',
                        background: 'rgba(255,255,255,0.08)', overflow: 'hidden'
                    }}>
                        <div className="progress-indeterminate" style={{
                            height: '100%', borderRadius: '3px',
                            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                        }} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>通常需要 5-15 秒</p>
                </div>
            )}

            {/* Step: Grouping Results */}
            {(step === 'grouping' || step === 'stories' || step === 'done') && groups.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                    {groups.map((group, i) => (
                        <div key={i} className="glass-card" style={{ overflow: 'hidden' }}>
                            {/* Room Header */}
                            <div
                                style={{
                                    padding: '1rem 1.5rem', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
                                    borderBottom: expandedGroups[i] ? '1px solid var(--glass-border)' : 'none'
                                }}
                                onClick={() => toggleGroup(i)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🚪</span>
                                    <div>
                                        <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>{group.roomName}</h3>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{group.words.length} 个单词</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {currentStoryIdx === i && <Loader2 size={16} className="spin" style={{ color: 'var(--primary)' }} />}
                                    {stories[i] && !stories[i].startsWith('⚠️') && <Check size={16} style={{ color: 'var(--success)' }} />}
                                    {expandedGroups[i] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {/* Room Content */}
                            {expandedGroups[i] && (
                                <div style={{ padding: '1.25rem 1.5rem' }}>
                                    {/* Words */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                                        {group.words.map((w, j) => (
                                            <span key={j} style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '0.4rem', padding: '0.3rem 0.6rem',
                                                fontSize: '0.8rem', border: '1px solid var(--glass-border)'
                                            }}>
                                                <strong>{w.word}</strong>
                                                {w.part_of_speech && <span style={{ color: 'var(--secondary)', marginLeft: '4px' }}>{w.part_of_speech}</span>}
                                                <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>{w.meaning}</span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Story */}
                                    {stories[i] && (
                                        <div style={{
                                            background: 'rgba(15, 23, 42, 0.5)', borderRadius: '0.75rem',
                                            padding: '1rem', fontSize: '0.9rem', lineHeight: 1.8,
                                            border: '1px solid var(--glass-border)', whiteSpace: 'pre-wrap'
                                        }}>
                                            {renderStoryWithHighlight(stories[i])}
                                        </div>
                                    )}

                                    {/* Regenerate Button */}
                                    {(step === 'done' || stories[i]) && (
                                        <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={() => handleRegenerateStory(i)}
                                                disabled={currentStoryIdx === i}
                                            >
                                                {currentStoryIdx === i ? (<><Loader2 size={14} className="spin" /> 生成中...</>) : (<><RefreshCw size={14} /> 重新生成故事</>)}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            {step === 'grouping' && !loading && groups.length > 0 && (
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="btn btn-secondary" onClick={handleGrouping}>
                            <RefreshCw size={18} /> 重新分组
                        </button>
                        <button className="btn btn-primary" onClick={handleGenerateStories} style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                            <Wand2 size={20} /> 为每个房间编写故事
                        </button>
                    </div>
                </div>
            )}

            {/* Story Generation Progress */}
            {step === 'stories' && loading && (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: '600', marginBottom: '0.75rem' }}>
                        正在为第 {currentStoryIdx + 1}/{groups.length} 个房间编写故事…
                    </p>
                    <div style={{
                        width: '100%', maxWidth: '400px', margin: '0 auto',
                        height: '8px', borderRadius: '4px',
                        background: 'rgba(255,255,255,0.08)', overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${Math.round(((currentStoryIdx + 1) / groups.length) * 100)}%`,
                            height: '100%', borderRadius: '4px',
                            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        {Math.round(((currentStoryIdx + 1) / groups.length) * 100)}% · 房间「{groups[currentStoryIdx]?.roomName}」
                    </p>
                </div>
            )}

            {step === 'done' && (
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="glass-card" style={{
                        display: 'inline-block', padding: '1.5rem 3rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(99, 102, 241, 0.1))',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✨</div>
                        <h3 style={{ marginBottom: '0.75rem', fontWeight: '700' }}>记忆宫殿构建完成！</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            共 {groups.length} 个房间已准备就绪
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveToPalace}
                            disabled={saving}
                            style={{ padding: '0.75rem 2rem' }}
                        >
                            {saving ? (<><Loader2 size={18} className="spin" /> 写入中...</>) : (<><Save size={18} /> 一键写入记忆宫殿</>)}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .progress-indeterminate {
                    width: 40%;
                    animation: indeterminate 1.5s ease-in-out infinite;
                }
                @keyframes indeterminate {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(350%); }
                }
            `}</style>
        </div>
    );
}

/** 渲染故事，高亮 **word** 格式的单词 */
function renderStoryWithHighlight(text) {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const word = part.slice(2, -2);
            return (
                <span key={i} style={{
                    color: 'var(--primary)', fontWeight: '700',
                    background: 'rgba(99, 102, 241, 0.15)',
                    padding: '0.1rem 0.3rem', borderRadius: '0.25rem'
                }}>
                    {word}
                </span>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

export default PalaceBuildPage;
