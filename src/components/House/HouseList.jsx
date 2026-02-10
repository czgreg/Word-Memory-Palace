import React from 'react';
import { Home, Edit2, Trash2 } from 'lucide-react';

const HouseList = ({ houses, selectedHouseId, onSelectHouse, onEditHouse, onDeleteHouse, onCreateHouse }) => {
    return (
        <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Home size={20} color="var(--primary)" />
                    房子列表
                </h2>
                <button
                    onClick={onCreateHouse}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                    + 新建房子
                </button>
            </div>

            {houses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Home size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>暂无房子</p>
                    <p style={{ fontSize: '0.875rem' }}>点击上方按钮创建第一个房子</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {houses.map(house => (
                        <div
                            key={house.id}
                            onClick={() => onSelectHouse(house.id)}
                            style={{
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                background: selectedHouseId === house.id
                                    ? 'var(--primary)'
                                    : 'var(--glass-bg)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: selectedHouseId === house.id
                                    ? '2px solid var(--primary)'
                                    : '2px solid transparent'
                            }}
                            className="hover-lift"
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: '600',
                                    marginBottom: '0.25rem',
                                    color: selectedHouseId === house.id ? 'white' : 'var(--text)'
                                }}>
                                    {house.name}
                                </div>
                                <div style={{
                                    fontSize: '0.875rem',
                                    color: selectedHouseId === house.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'
                                }}>
                                    {house.room_count || 0} 个房间
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditHouse(house);
                                    }}
                                    className="btn-secondary"
                                    style={{
                                        padding: '0.4rem',
                                        borderRadius: '0.5rem',
                                        background: selectedHouseId === house.id ? 'rgba(255,255,255,0.2)' : undefined,
                                        color: selectedHouseId === house.id ? 'white' : undefined
                                    }}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteHouse(house.id);
                                    }}
                                    className="btn-secondary"
                                    style={{
                                        padding: '0.4rem',
                                        borderRadius: '0.5rem',
                                        background: selectedHouseId === house.id ? 'rgba(255,255,255,0.2)' : undefined,
                                        color: 'var(--danger)'
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HouseList;
