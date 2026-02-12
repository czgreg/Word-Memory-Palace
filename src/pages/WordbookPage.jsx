import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';
import { wordbookRepository } from '../db/repositories/wordbookRepository';
import { aiService } from '../utils/aiService';
import { BookOpen, Plus, Trash2, Zap, FileText, Upload, X, Wand2, Loader2, Sparkles } from 'lucide-react';

function WordbookPage() {
    const { isReady } = useDatabase();
    const navigate = useNavigate();
    const [wordbooks, setWordbooks] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [mdContent, setMdContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [error, setError] = useState('');
    const [pageLoading, setPageLoading] = useState(true);
    const [optimizing, setOptimizing] = useState(null); // wordbookId being optimized
    const [progress, setProgress] = useState({ completed: 0, total: 0 }); // AI progress

    useEffect(() => {
        if (isReady) loadWordbooks();
    }, [isReady]);

    const loadWordbooks = async () => {
        setPageLoading(true);
        try {
            const data = await wordbookRepository.getAll();
            setWordbooks(data);
        } catch (err) {
            console.error('加载单词本失败:', err);
        } finally {
            setPageLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) { setError('请输入单词本名称'); return; }
        if (!mdContent.trim()) { setError('请输入单词内容'); return; }
        if (!aiService.isConfigured()) {
            setError('请先在设置中配置 AI API（导入时需要 AI 判断最佳词性和词义）');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Step 1: 提取纯单词列表（支持任意格式输入，只提取英文单词）
            const lines = mdContent.trim().split('\n').map(l => l.trim()).filter(Boolean);
            const words = [];
            for (const line of lines) {
                // 跳过表头
                if (/^\|?\s*[-:]+\s*\|/.test(line)) continue;
                if (/单词|word/i.test(line) && /词义|meaning/i.test(line)) continue;

                // 从每行提取第一个英文单词
                let word = null;
                if (line.includes('|')) {
                    const cells = line.split('|').map(s => s.trim()).filter(Boolean);
                    if (cells.length > 0) word = cells[0];
                } else if (line.includes(':')) {
                    word = line.split(':')[0].trim().split(/\s+/)[0];
                } else {
                    word = line.split(/\s+/)[0];
                }

                if (word && /^[a-zA-Z]+(-[a-zA-Z]+)*$/.test(word)) {
                    words.push(word);
                }
            }

            if (words.length === 0) {
                setError('未提取到任何英文单词，请检查输入');
                setLoading(false);
                return;
            }

            // Step 2: AI 判断每个单词最常见的词性和词义
            setLoadingMsg(`AI 正在为 ${words.length} 个单词判断最佳词性和词义...`);
            setProgress({ completed: 0, total: words.length });
            const aiResults = await aiService.batchLookupWords(words, (completed, total) => {
                setProgress({ completed, total });
                setLoadingMsg(`AI 正在查询词义... ${completed}/${total}`);
            });

            // Step 3: 转为 Markdown 表格格式并导入
            const mdTable = aiResults.map(r => `| ${r.word} | ${r.part_of_speech} | ${r.meaning} |`).join('\n');
            const fullMd = `| 单词 | 词性 | 词义 |\n|------|------|------|\n${mdTable}`;

            setLoadingMsg('正在写入数据库...');
            const id = await wordbookRepository.create(newName.trim(), newDesc.trim());
            const count = await wordbookRepository.importMarkdown(id, fullMd);

            setShowCreateModal(false);
            setNewName('');
            setNewDesc('');
            setMdContent('');
            await loadWordbooks();
            alert(`✅ AI 智能导入完成！共 ${count} 个单词`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMsg('');
        }
    };

    /** AI 优化现有单词本：重新判断每个单词的最佳词性和词义 */
    const handleOptimize = async (wb) => {
        if (!aiService.isConfigured()) {
            alert('请先在设置中配置 AI API');
            return;
        }
        if (!confirm(`AI 将重新判断「${wb.name}」中所有单词的最佳词性和词义，是否继续？`)) return;

        setOptimizing(wb.id);
        setProgress({ completed: 0, total: 0 });
        try {
            const entries = await wordbookRepository.getEntries(wb.id);
            if (entries.length === 0) { alert('该单词本没有词条'); setOptimizing(null); return; }

            // 提取所有单词
            const words = entries.map(e => e.word).filter(w => /^[a-zA-Z]+(-[a-zA-Z]+)*$/.test(w));
            if (words.length === 0) { alert('没有可优化的英文单词'); setOptimizing(null); return; }

            // AI 批量查询
            setProgress({ completed: 0, total: words.length });
            const aiResults = await aiService.batchLookupWords(words, (completed, total) => {
                setProgress({ completed, total });
            });

            // 建立 word -> AI结果 的映射
            const aiMap = {};
            aiResults.forEach(r => { aiMap[r.word.toLowerCase()] = r; });

            // 更新每条词条
            let updated = 0;
            for (const entry of entries) {
                const ai = aiMap[entry.word.toLowerCase()];
                if (ai && (ai.part_of_speech !== entry.part_of_speech || ai.meaning !== entry.meaning)) {
                    await wordbookRepository.updateEntry(entry.id, ai.part_of_speech, ai.meaning);
                    updated++;
                }
            }

            await loadWordbooks();
            alert(`✅ 优化完成！更新了 ${updated} 个词条的词性和词义`);
        } catch (err) {
            alert('优化失败: ' + err.message);
        } finally {
            setOptimizing(null);
            setProgress({ completed: 0, total: 0 });
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`确定删除单词本「${name}」及所有词条？`)) return;
        try {
            await wordbookRepository.delete(id);
            await loadWordbooks();
        } catch (err) {
            console.error('删除失败:', err);
        }
    };

    const handleReset = async (id, name) => {
        if (!confirm(`确定重置「${name}」的所有刷词记录？`)) return;
        try {
            await wordbookRepository.resetEntries(id);
            await loadWordbooks();
        } catch (err) {
            console.error('重置失败:', err);
        }
    };

    return (
        <div style={{ minHeight: '60vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                        📖 单词本
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>管理你的单词列表，快刷标记认识与不认识</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} /> 新建单词本
                </button>
            </div>

            {/* Wordbook List */}
            {pageLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>加载中...</div>
            ) : wordbooks.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>还没有单词本</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>点击上方按钮创建你的第一本单词本</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {wordbooks.map(wb => {
                        const total = wb.entry_count || 0;
                        const known = wb.known_count || 0;
                        const unknown = wb.unknown_count || 0;
                        const unreviewed = wb.unreviewed_count || 0;
                        const reviewProgress = total > 0 ? ((total - unreviewed) / total * 100) : 0;
                        const isOptimizing = optimizing === wb.id;

                        return (
                            <div key={wb.id} className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={20} style={{ color: 'var(--primary)' }} />
                                            {wb.name}
                                        </h3>
                                        {wb.description && (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{wb.description}</p>
                                        )}

                                        {/* Stats */}
                                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>总计 <strong style={{ color: 'var(--text)' }}>{total}</strong> 词</span>
                                            <span style={{ color: 'var(--success)' }}>✅ 认识 {known}</span>
                                            <span style={{ color: 'var(--danger)' }}>❌ 不认识 {unknown}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>⏳ 待刷 {unreviewed}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{
                                            height: '6px', borderRadius: '3px',
                                            background: 'rgba(255,255,255,0.1)', overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: '3px',
                                                width: `${reviewProgress}%`,
                                                background: `linear-gradient(90deg, var(--primary), var(--secondary))`,
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>

                                        {/* AI Optimize Progress Bar */}
                                        {isOptimizing && progress.total > 0 && (
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                                                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>✨ AI 优化中...</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{progress.completed}/{progress.total} 词</span>
                                                </div>
                                                <div style={{
                                                    height: '8px', borderRadius: '4px',
                                                    background: 'rgba(99, 102, 241, 0.1)', overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: '4px',
                                                        width: `${(progress.completed / progress.total) * 100}%`,
                                                        background: 'linear-gradient(90deg, #818cf8, #6366f1, #4f46e5)',
                                                        transition: 'width 0.3s ease',
                                                        boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)'
                                                    }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                            onClick={() => navigate(`/wordbook/${wb.id}/review`)}
                                        >
                                            <Zap size={16} /> 快刷
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--primary)' }}
                                            onClick={() => handleOptimize(wb)}
                                            disabled={isOptimizing}
                                            title="AI 优化词性和词义"
                                        >
                                            {isOptimizing ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                                            {isOptimizing ? ' 优化中' : ' AI优化'}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                                            onClick={() => handleReset(wb.id, wb.name)}
                                            title="重置刷词记录"
                                        >
                                            🔄
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 0.75rem', color: 'var(--danger)' }}
                                            onClick={() => handleDelete(wb.id, wb.name)}
                                            title="删除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => !loading && setShowCreateModal(false)}>
                    <div className="glass-card" style={{
                        padding: '2rem', width: '90%', maxWidth: '700px', maxHeight: '85vh',
                        overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>📖 新建单词本</h2>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => !loading && setShowCreateModal(false)}>
                                <X size={18} />
                            </button>
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

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                                单词本名称 *
                            </label>
                            <input
                                className="input-field"
                                placeholder="例如：四级核心词汇"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                                描述（可选）
                            </label>
                            <input
                                className="input-field"
                                placeholder="例如：大学英语四级高频词汇"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                                单词列表 *
                            </label>
                            <div style={{
                                background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)',
                                borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.75rem',
                                fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                    <Wand2 size={13} style={{ color: 'var(--primary)' }} />
                                    <strong style={{ color: 'var(--primary)' }}>AI 自动判断</strong>：无论哪种输入格式，AI 都会为每个单词选择最常见的词性和词义
                                </div>
                                支持输入格式：每行一个单词 / 表格 / 冒号 / 空格分隔
                            </div>
                            <textarea
                                className="input-field"
                                style={{ minHeight: '250px', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }}
                                placeholder={`每行一个英文单词即可，AI 自动识别词义：\nabandon\nability\nabsolute\nabstract\n\n也支持带词义格式（AI 会重新判断最佳词义）：\nabandon v. 放弃\nability n. 能力`}
                                value={mdContent}
                                onChange={e => setMdContent(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {/* Loading indicator */}
                        {loading && loadingMsg && (
                            <div style={{
                                background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem',
                                fontSize: '0.875rem', color: 'var(--primary)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: progress.total > 0 ? '0.5rem' : 0 }}>
                                    <Loader2 size={16} className="spin" />
                                    {loadingMsg}
                                </div>
                                {progress.total > 0 && (
                                    <div style={{
                                        height: '6px', borderRadius: '3px',
                                        background: 'rgba(99, 102, 241, 0.1)', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: '3px',
                                            width: `${(progress.completed / progress.total) * 100}%`,
                                            background: 'linear-gradient(90deg, #818cf8, #6366f1, #4f46e5)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={loading}>
                                取消
                            </button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                                {loading ? (<><Loader2 size={16} className="spin" /> 处理中...</>) : (<><Upload size={16} /> 创建并导入</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default WordbookPage;
