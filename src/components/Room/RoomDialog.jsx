import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const RoomDialog = ({ isOpen, onClose, onSave, editingRoom = null }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (editingRoom) {
            setName(editingRoom.name);
        } else {
            setName('');
        }
    }, [editingRoom, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
            setName('');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div
                className="glass-card animate-fade"
                style={{
                    padding: '2rem',
                    width: '90%',
                    maxWidth: '500px',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s'
                    }}
                    className="hover-lift"
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                    {editingRoom ? '编辑房间' : '新建房间'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            房间名称
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="请输入房间名称..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!name.trim()}
                        >
                            {editingRoom ? '保存' : '创建'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoomDialog;
