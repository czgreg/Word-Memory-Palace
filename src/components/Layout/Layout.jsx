import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layout as LayoutIcon, BookOpen, Trophy, Settings, X, ChevronDown, ChevronUp } from 'lucide-react';
import { aiService } from '../../utils/aiService';

const AISettingsModal = ({ onClose }) => {
    const [form, setForm] = useState(aiService.getConfig());
    const [ollamaOk, setOllamaOk] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        aiService.checkOllamaAvailable().then(setOllamaOk);
    }, []);

    const handleSave = () => {
        aiService.saveConfig(form);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 800);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div className="glass-card" style={{
                padding: '2rem', width: '90%', maxWidth: '550px',
                maxHeight: '85vh', overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={20} style={{ color: 'var(--primary)' }} />
                        AI API 设置
                    </h2>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Mode Switch */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[
                        { id: 'remote', label: '☁️ 远程 API' },
                        { id: 'local', label: '💻 本地 Ollama', status: ollamaOk }
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

                {form.mode === 'remote' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Presets */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>快速选择</label>
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
                            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>API 地址</label>
                            <input
                                className="input-field"
                                value={form.remoteUrl}
                                onChange={e => setForm(f => ({ ...f, remoteUrl: e.target.value }))}
                                placeholder="https://api.openai.com/v1/chat/completions"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>API Key</label>
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
                            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>模型名称</label>
                            <input
                                className="input-field"
                                value={form.remoteModel}
                                onChange={e => setForm(f => ({ ...f, remoteModel: e.target.value }))}
                                placeholder="gpt-4o-mini"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>模型名称</label>
                        <input
                            className="input-field"
                            value={form.localModel}
                            onChange={e => setForm(f => ({ ...f, localModel: e.target.value }))}
                            placeholder="例如 qwen3-4b"
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        {!ollamaOk && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>
                                ⚠️ Ollama 未运行。请先安装并启动：<code>brew install ollama && ollama serve</code>
                            </div>
                        )}
                    </div>
                )}

                {/* Save Button */}
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
                    onClick={handleSave}
                >
                    {saved ? '✓ 已保存' : '保存配置'}
                </button>
            </div>
        </div>
    );
};

const Navbar = () => {
    const location = useLocation();
    const [showSettings, setShowSettings] = useState(false);

    const navItems = [
        { path: '/', icon: <Home size={20} />, label: '首页' },
        { path: '/wordbooks', icon: <BookOpen size={20} />, label: '单词本' },
        { path: '/rooms', icon: <LayoutIcon size={20} />, label: '房间管理' },
        { path: '/custom-challenge', icon: <Trophy size={20} />, label: '自定义挑战' },
    ];

    const isAiReady = aiService.isConfigured();

    return (
        <>
            <nav className="glass-card" style={{
                margin: '1rem',
                padding: '0.5rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: '1rem',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        padding: '8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <BookOpen color="white" size={24} />
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
                        单词记忆宫殿
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="btn"
                            style={{
                                background: location.pathname === item.path ? 'var(--glass-bg)' : 'transparent',
                                color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)',
                                padding: '0.6rem 1rem'
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    {/* Settings Button */}
                    <button
                        className="btn"
                        onClick={() => setShowSettings(true)}
                        style={{
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            padding: '0.6rem',
                            position: 'relative'
                        }}
                        title="AI 设置"
                    >
                        <Settings size={20} />
                        {/* Status dot */}
                        <span style={{
                            position: 'absolute', top: '6px', right: '6px',
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: isAiReady ? 'var(--success)' : 'var(--danger)',
                            border: '2px solid var(--surface)'
                        }} />
                    </button>
                </div>
            </nav>

            {showSettings && <AISettingsModal onClose={() => setShowSettings(false)} />}
        </>
    );
};

const Layout = ({ children }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main className="container animate-fade" style={{ flex: 1, paddingBottom: '2rem' }}>
                {children}
            </main>
            <footer style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                borderTop: '1px solid var(--glass-border)'
            }}>
                © 2026 单词记忆宫殿 - 使用空间记忆法背单词
            </footer>
        </div>
    );
};

export default Layout;
