import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, CheckCircle2, XCircle, Volume2, Loader2, ArrowRight, Settings2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { wordRepository } from '../db/repositories/wordRepository';
import { storyRepository } from '../db/repositories/storyRepository';
import { generateQuestions } from '../utils/challengeUtils';
import { useSpeech } from '../hooks/useSpeech';

const ChallengePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isReady } = useDatabase();
    const { speak } = useSpeech();

    const [gameState, setGameState] = useState('config'); // 'config', 'playing', 'result'
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null); // { isCorrect, correctAnswer }
    const [allowedTypes, setAllowedTypes] = useState(['listen', 'ch_to_en', 'en_to_ch', 'story_fill']);

    const [allWords, setAllWords] = useState([]);
    const [roomStory, setRoomStory] = useState('');

    useEffect(() => {
        if (isReady) {
            const fetchData = async () => {
                const words = await wordRepository.getByRoomId(id);
                const story = await storyRepository.getByRoomId(id);
                const activeWords = words.filter(w => w.word.trim());

                setAllWords(activeWords);
                setRoomStory(story?.content || '');
                setIsLoading(false);
            };
            fetchData();
        }
    }, [id, isReady]);

    const startChallenge = () => {
        if (allowedTypes.length === 0) return;
        const qs = generateQuestions(allWords, roomStory, allowedTypes);
        setQuestions(qs);
        setGameState('playing');
        setCurrentIdx(0);
        setScore(0);
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
            <div className="animate-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            width: '64px', height: '64px', borderRadius: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <Settings2 size={32} color="white" />
                        </div>
                        <h2>配置挑战</h2>
                        <p style={{ color: 'var(--text-muted)' }}>选择你想要练习的题型</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { id: 'listen', label: '听音选词', desc: '听到发音并选择正确的单词' },
                            { id: 'ch_to_en', label: '中译英', desc: '根据中文提示拼写英文单词' },
                            { id: 'en_to_ch', label: '英译中', desc: '选择英文单词对应的中文含义' },
                            { id: 'story_fill', label: '故事填空', desc: '在故事片段中填入遗忘的单词' },
                        ].map(type => (
                            <label key={type.id} className="glass-card" style={{
                                padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                                border: allowedTypes.includes(type.id) ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                background: allowedTypes.includes(type.id) ? 'var(--primary-glow)' : 'var(--glass-bg)'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={allowedTypes.includes(type.id)}
                                    onChange={() => {
                                        setAllowedTypes(prev =>
                                            prev.includes(type.id) ? prev.filter(t => t !== type.id) : [...prev, type.id]
                                        );
                                    }}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{type.label}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{type.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem' }}
                        disabled={allowedTypes.length === 0}
                        onClick={startChallenge}
                    >
                        开始挑战 (共 {allWords.length} 题)
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'playing') {
        const q = questions[currentIdx];
        return (
            <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    <span>第 {currentIdx + 1} / {questions.length} 题</span>
                    <span>正确数: {score}</span>
                </div>

                <div className="glass-card" style={{ padding: '3rem', position: 'relative' }}>
                    {q.type === 'listen' && (
                        <div style={{ textAlign: 'center' }}>
                            <button
                                onClick={() => speak(q.audioText)}
                                className="btn-primary"
                                style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Volume2 size={32} />
                            </button>
                            <h3 style={{ marginBottom: '2rem' }}>请选择你听到的单词</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {q.options.map(opt => (
                                    <button
                                        key={opt}
                                        className="btn btn-secondary"
                                        onClick={() => handleAnswer(opt)}
                                        style={{
                                            padding: '1.5rem', fontSize: '1.25rem',
                                            borderColor: feedback?.correctAnswer === opt ? 'var(--success)' :
                                                (feedback?.isCorrect === false && userInput === opt ? 'var(--danger)' : 'var(--glass-border)')
                                        }}
                                    >
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
                                    <button
                                        key={opt}
                                        className="btn btn-secondary"
                                        onClick={() => handleAnswer(opt)}
                                        style={{
                                            padding: '1.5rem', fontSize: '1.25rem',
                                            borderColor: feedback?.correctAnswer === opt ? 'var(--success)' :
                                                (feedback?.isCorrect === false && userInput === opt ? 'var(--danger)' : 'var(--glass-border)')
                                        }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(q.type === 'ch_to_en' || q.type === 'story_fill') && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                {q.type === 'ch_to_en' ? '中译英' : '故事填空'}
                            </div>

                            {q.type === 'ch_to_en' ? (
                                <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '2rem', color: 'var(--primary)' }}>{q.meaning}</h2>
                            ) : (
                                <div style={{ fontSize: '1.5rem', lineHeight: '1.6', marginBottom: '2rem', background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '1rem' }}>
                                    {q.context}
                                </div>
                            )}

                            <input
                                type="text"
                                autoFocus
                                className="input-field"
                                placeholder="在此输入拼写..."
                                style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1rem', width: '100%', maxWidth: '400px' }}
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAnswer(userInput)}
                                disabled={!!feedback}
                            />
                            {!feedback && (
                                <button
                                    className="btn btn-primary"
                                    style={{ display: 'block', margin: '1.5rem auto 0', padding: '0.75rem 3rem' }}
                                    onClick={() => handleAnswer(userInput)}
                                >
                                    提交答案
                                </button>
                            )}
                        </div>
                    )}

                    {feedback && (
                        <div className={`animate-fade`} style={{
                            marginTop: '2rem', padding: '1.5rem', borderRadius: '1rem',
                            background: feedback.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${feedback.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {feedback.isCorrect ? <CheckCircle2 color="var(--success)" /> : <XCircle color="var(--danger)" />}
                                <div>
                                    <div style={{ fontWeight: 'bold', color: feedback.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                                        {feedback.isCorrect ? '正确！速度很快嘛！' : '哎呀，记错了...'}
                                    </div>
                                    {!feedback.isCorrect && <div style={{ fontSize: '0.875rem' }}>正确答案是: <span style={{ fontWeight: 'bold' }}>{feedback.correctAnswer}</span></div>}
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={nextQuestion}>
                                <span>下一题</span>
                                <ArrowRight size={18} />
                            </button>
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
                    <div style={{ marginBottom: '2rem' }}>
                        <Trophy size={80} color={percentage >= 80 ? 'var(--warning)' : 'var(--text-muted)'} style={{ margin: '0 auto' }} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>挑战结束</h1>
                    <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '0.5rem' }}>{score} / {questions.length}</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {percentage === 100 ? '完美！你已经完全掌握了这些单词！' :
                            percentage >= 80 ? '太棒了！继续保持！' : '不错，再多复习几次就更好了。'}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/rooms')}>
                            返回列表
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setGameState('config')}>
                            再来一局
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};

export default ChallengePage;
