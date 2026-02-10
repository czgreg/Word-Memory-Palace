import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Info, Loader2, Play, Wand2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { roomRepository } from '../db/repositories/roomRepository';
import { wordRepository } from '../db/repositories/wordRepository';
import { storyRepository } from '../db/repositories/storyRepository';

const RoomDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isReady } = useDatabase();

    const [room, setRoom] = useState(null);
    const [words, setWords] = useState(Array(10).fill({ word: '', phonetic: '', meaning: '' }));
    const [story, setStory] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeLoadingIdx, setActiveLoadingIdx] = useState(null);

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
            const initialWords = Array(10).fill(null).map((_, i) => wordsData[i] || { word: '', phonetic: '', meaning: '' });
            setWords(initialWords);

            const storyData = await storyRepository.getByRoomId(id);
            setStory(storyData?.content || '');
        } catch (err) {
            console.error("加载详情失败:", err);
        } finally {
            setIsLoading(false);
        }
    }, [id, isReady, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleWordChange = (index, field, value) => {
        const newWords = [...words];
        newWords[index] = { ...newWords[index], [field]: value };
        setWords(newWords);
    };

    const handleAutoFill = async (index) => {
        const word = words[index].word.trim();
        if (!word) return;

        setActiveLoadingIdx(index);
        try {
            // Fetch from Free Dictionary API for phonetics and POS
            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const dictData = await dictRes.json();

            // Fetch from Google Translate API (free tier) for Chinese meaning
            const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(word)}`);
            const transData = await transRes.json();

            let phonetic = '';
            let pos = '';
            let meaning = transData?.[0]?.[0]?.[0] || '';

            if (Array.isArray(dictData) && dictData.length > 0) {
                phonetic = dictData[0].phonetic || dictData[0].phonetics?.[0]?.text || '';
                pos = dictData[0].meanings?.[0]?.partOfSpeech || '';
            }

            const newWords = [...words];
            newWords[index] = {
                ...newWords[index],
                phonetic: phonetic || newWords[index].phonetic,
                meaning: pos ? `[${pos}] ${meaning}` : meaning
            };
            setWords(newWords);
        } catch (err) {
            console.error("自动识别失败:", err);
            alert("自动识别失败，请检查网络或单词拼写。");
        } finally {
            setActiveLoadingIdx(null);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save words
            for (let i = 0; i < words.length; i++) {
                const w = words[i];
                if (w.word.trim()) {
                    await wordRepository.upsert(w.id, id, w.word.trim(), w.phonetic.trim(), w.meaning.trim(), i);
                } else if (w.id) {
                    await wordRepository.delete(w.id);
                }
            }

            // Save story
            await storyRepository.upsert(id, story);

            alert("保存成功！");
            fetchData(); // Reload to get IDs
        } catch (err) {
            console.error("保存失败:", err);
            alert("保存失败，请重试。");
        } finally {
            setIsSaving(false);
        }
    };

    const renderHighlightedStory = () => {
        if (!story) return <span style={{ color: 'var(--text-muted)' }}>尚未编写故事...</span>;

        const validWords = words.map(w => w.word.trim().toLowerCase()).filter(w => w);
        if (validWords.length === 0) return story;

        // Sort by length descending to avoid partial matches
        validWords.sort((a, b) => b.length - a.length);

        const regex = new RegExp(`(${validWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
        const parts = story.split(regex);

        return parts.map((part, i) => {
            const isMatch = validWords.includes(part.toLowerCase());
            return isMatch ? (
                <span key={i} style={{
                    color: 'var(--primary)',
                    fontWeight: 'bold',
                    borderBottom: '2px solid var(--primary)',
                    padding: '0 2px'
                }}>
                    {part}
                </span>
            ) : part;
        });
    };

    if (!isReady || isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/rooms" className="btn-secondary" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>{room?.name}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>管理房间内的单词和线性故事</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to={`/room/${id}/learn`} className="btn btn-secondary">
                        <Play size={18} />
                        <span>进入预览</span>
                    </Link>
                    <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>保存更改</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left Column: Words */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Info size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem' }}>本房间单词 (最多10个)</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {words.map((w, index) => (
                            <div key={index} style={{
                                display: 'grid',
                                gridTemplateColumns: '30px 1fr 1fr 1.5fr 44px',
                                gap: '0.5rem',
                                alignItems: 'center',
                                background: 'var(--glass-bg)',
                                padding: '0.5rem',
                                borderRadius: '0.75rem'
                            }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.8rem' }}>{index + 1}</span>
                                <input
                                    type="text"
                                    placeholder="单词"
                                    className="input-field"
                                    style={{ padding: '0.5rem' }}
                                    value={w.word}
                                    onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="音标"
                                    className="input-field"
                                    style={{ padding: '0.5rem' }}
                                    value={w.phonetic}
                                    onChange={(e) => handleWordChange(index, 'phonetic', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="中文释义"
                                    className="input-field"
                                    style={{ padding: '0.5rem' }}
                                    value={w.meaning}
                                    onChange={(e) => handleWordChange(index, 'meaning', e.target.value)}
                                />
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem', borderRadius: '0.5rem', opacity: w.word ? 1 : 0.3 }}
                                    onClick={() => handleAutoFill(index)}
                                    disabled={!w.word || activeLoadingIdx !== null}
                                    title="自动识别"
                                >
                                    {activeLoadingIdx === index ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Story */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>故事创作区</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            提示：编写一个线性路径故事（推门进入 &rarr; 左边 &rarr; 中间 &rarr; 右边）。
                        </p>
                        <textarea
                            className="input-field"
                            style={{ width: '100%', height: '300px', resize: 'none', lineHeight: '1.6' }}
                            placeholder="我推门进去..."
                            value={story}
                            onChange={(e) => setStory(e.target.value)}
                        />
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>故事预览 (即时高亮)</h3>
                        <div style={{
                            lineHeight: '1.8',
                            fontSize: '1.1rem',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            minHeight: '100px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {renderHighlightedStory()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomDetailPage;
