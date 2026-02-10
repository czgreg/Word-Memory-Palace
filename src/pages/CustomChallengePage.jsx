import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Settings2, Loader2, CheckCircle2, XCircle, Volume2, ArrowRight } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { roomRepository } from '../db/repositories/roomRepository';
import { wordRepository } from '../db/repositories/wordRepository';
import { storyRepository } from '../db/repositories/storyRepository';
import { generateQuestions } from '../utils/challengeUtils';
import { useSpeech } from '../hooks/useSpeech';

const CustomChallengePage = () => {
    const navigate = useNavigate();
    const { isReady } = useDatabase();
    const { speak } = useSpeech();

    const [gameState, setGameState] = useState('config'); // 'config', 'playing', 'result'
    const [rooms, setRooms] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [allowedTypes, setAllowedTypes] = useState(['listen', 'ch_to_en', 'en_to_ch', 'story_fill']);

    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        if (isReady) {
            roomRepository.getAll().then(data => {
                setRooms(data);
                setIsLoading(false);
            });
        }
    }, [isReady]);

    const handleToggleRoom = (id) => {
        setSelectedRooms(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const startChallenge = async () => {
        if (selectedRooms.length === 0 || allowedTypes.length === 0) return;

        setIsStarting(true);
        try {
            let allWords = [];
            let storiesContent = "";

            for (const roomId of selectedRooms) {
                const words = await wordRepository.getByRoomId(roomId);
                const story = await storyRepository.getByRoomId(roomId);
                allWords = [...allWords, ...words.filter(w => w.word.trim())];
                if (story?.content) storiesContent += "\n" + story.content;
            }

            if (allWords.length === 0) {
                alert("所选房间内没有可用的单词！");
                return;
            }

            const qs = generateQuestions(allWords, storiesContent, allowedTypes);
            setQuestions(qs);
            setGameState('playing');
            setCurrentIdx(0);
            setScore(0);
        } catch (err) {
            console.error("启动大挑战失败:", err);
        } finally {
            setIsStarting(false);
        }
    };

    const handleAnswer = (answer) => {
        if (feedback) return;
        const currentQ = questions[currentIdx];
        const isCorrect = answer.trim().toLowerCase() === currentQ.answer.toLowerCase();
        setFeedback({ isCorrect, correctAnswer: currentQ.answer });
        if (isCorrect) setScore(s => s + 1);
    };

    const nextQuestion = () => {
        setFeedback(null);
        setUserInput('');
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(i => i + 1);
        } else {
            setGameState('result');
        }
    };

    if (isLoading || !isReady) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" /></div>;
    }

    if (gameState === 'config') {
        return (
            <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' }}>大挑战设置</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={18} /> 选择房间
                        </h2>
                        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedRooms.length === rooms.length && rooms.length > 0}
                                    onChange={() => {
                                        if (selectedRooms.length === rooms.length) setSelectedRooms([]);
                                        else setSelectedRooms(rooms.map(r => r.id));
                                    }}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontWeight: 'bold' }}>全选所有房间</span>
                            </label>
                            {rooms.map(room => (
                                <label key={room.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', cursor: 'pointer', opacity: selectedRooms.includes(room.id) ? 1 : 0.7 }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedRooms.includes(room.id)}
                                        onChange={() => handleToggleRoom(room.id)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <div>
                                        <div>{room.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{room.word_count || 0} 个单词</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings2 size={18} /> 选择题型
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { id: 'listen', label: '听音选词' },
                                { id: 'ch_to_en', label: '中译英' },
                                { id: 'en_to_ch', label: '英译中' },
                                { id: 'story_fill', label: '故事填空' },
                            ].map(type => (
                                <label key={type.id} className="glass-card" style={{
                                    padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                                    border: allowedTypes.includes(type.id) ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                    background: allowedTypes.includes(type.id) ? 'var(--primary-glow)' : 'transparent'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={allowedTypes.includes(type.id)}
                                        onChange={() => {
                                            setAllowedTypes(prev =>
                                                prev.includes(type.id) ? prev.filter(t => t !== type.id) : [...prev, type.id]
                                            );
                                        }}
                                    />
                                    <span>{type.label}</span>
                                </label>
                            ))}
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1.25rem', marginTop: '2rem' }}
                            disabled={selectedRooms.length === 0 || allowedTypes.length === 0 || isStarting}
                            onClick={startChallenge}
                        >
                            {isStarting ? <Loader2 className="animate-spin" /> : <Trophy size={20} />}
                            <span>开启大挑战</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Reuse playing/result states from ChallengePage (Simplified for demo, could be a shared component)
    if (gameState === 'playing') {
        const q = questions[currentIdx];
        return (
            <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    <span>大挑战进度: {currentIdx + 1} / {questions.length}</span>
                    <span>得分: {score}</span>
                </div>

                <div className="glass-card" style={{ padding: '3rem', position: 'relative' }}>
                    {q.type === 'listen' && (
                        <div style={{ textAlign: 'center' }}>
                            <button onClick={() => speak(q.audioText)} className="btn-primary" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Volume2 size={32} />
                            </button>
                            <h3 style={{ marginBottom: '2rem' }}>请选择你听到的单词</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {q.options.map(opt => (
                                    <button key={opt} className="btn btn-secondary" onClick={() => handleAnswer(opt)} style={{ padding: '1.5rem', fontSize: '1.25rem', borderColor: feedback?.correctAnswer === opt ? 'var(--success)' : (feedback?.isCorrect === false && userInput === opt ? 'var(--danger)' : 'var(--glass-border)') }}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {q.type === 'en_to_ch' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>英译中</div>
                            <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '2rem' }}>{q.word}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {q.options.map(opt => (
                                    <button key={opt} className="btn btn-secondary" onClick={() => handleAnswer(opt)} style={{ padding: '1.5rem', fontSize: '1.25rem', borderColor: feedback?.correctAnswer === opt ? 'var(--success)' : (feedback?.isCorrect === false && userInput === opt ? 'var(--danger)' : 'var(--glass-border)') }}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(q.type === 'ch_to_en' || q.type === 'story_fill') && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{q.type === 'ch_to_en' ? '中译英' : '故事填空'}</div>
                            {q.type === 'ch_to_en' ? <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '2rem', color: 'var(--primary)' }}>{q.meaning}</h2> : <div style={{ fontSize: '1.5rem', lineHeight: '1.6', marginBottom: '2rem', background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '1rem' }}>{q.context}</div>}
                            <input type="text" autoFocus className="input-field" placeholder="在此输入拼写..." style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1rem', width: '100%', maxWidth: '400px' }} value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAnswer(userInput)} disabled={!!feedback} />
                            {!feedback && <button className="btn btn-primary" style={{ display: 'block', margin: '1.5rem auto 0', padding: '0.75rem 3rem' }} onClick={() => handleAnswer(userInput)}>提交答案</button>}
                        </div>
                    )}

                    {feedback && (
                        <div className="animate-fade" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '1rem', background: feedback.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${feedback.isCorrect ? 'var(--success)' : 'var(--danger)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {feedback.isCorrect ? <CheckCircle2 color="var(--success)" /> : <XCircle color="var(--danger)" />}
                                <div>
                                    <div style={{ fontWeight: 'bold', color: feedback.isCorrect ? 'var(--success)' : 'var(--danger)' }}>{feedback.isCorrect ? '正确！' : '错误'}</div>
                                    {!feedback.isCorrect && <div style={{ fontSize: '0.875rem' }}>正确答案是: <span style={{ fontWeight: 'bold' }}>{feedback.correctAnswer}</span></div>}
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={nextQuestion}>下一题 <ArrowRight size={18} /></button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === 'result') {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="animate-fade" style={{ maxWidth: '600px', margin: '4rem auto' }}>
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Trophy size={80} color="var(--warning)" style={{ margin: '0 auto 1.5rem' }} />
                    <h1>大挑战结果</h1>
                    <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--primary)', margin: '1rem 0' }}>{score} / {questions.length}</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>命中率 {percentage}%。不论结果如何，坚持练习就是胜利！</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/')}>回首页</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setGameState('config')}>重新开始</button>
                    </div>
                </div>
            </div>
        );
    }
};

export default CustomChallengePage;
