import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layout as LayoutIcon, BookOpen, Trophy, Settings } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: <Home size={20} />, label: '首页' },
        { path: '/rooms', icon: <LayoutIcon size={20} />, label: '房间管理' },
        { path: '/custom-challenge', icon: <Trophy size={20} />, label: '自定义挑战' },
    ];

    return (
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

            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            </div>
        </nav>
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
