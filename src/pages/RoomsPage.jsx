import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { houseRepository } from '../db/repositories/houseRepository';
import { roomRepository } from '../db/repositories/roomRepository';
import HouseList from '../components/House/HouseList';
import RoomList from '../components/Room/RoomList';
import HouseDialog from '../components/House/HouseDialog';
import RoomDialog from '../components/Room/RoomDialog';

const RoomsPage = () => {
    const { isReady } = useDatabase();
    const [houses, setHouses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedHouseId, setSelectedHouseId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Dialog states
    const [isHouseDialogOpen, setIsHouseDialogOpen] = useState(false);
    const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
    const [editingHouse, setEditingHouse] = useState(null);
    const [editingRoom, setEditingRoom] = useState(null);

    const fetchHouses = async () => {
        try {
            const data = await houseRepository.getAll();
            setHouses(data);

            // 自动选中第一个房子
            if (data.length > 0 && !selectedHouseId) {
                setSelectedHouseId(data[0].id);
            }
        } catch (err) {
            console.error("加载房子失败:", err);
        }
    };

    const fetchRooms = async (houseId) => {
        if (!houseId) {
            setRooms([]);
            return;
        }

        try {
            const data = await roomRepository.getByHouseId(houseId);
            setRooms(data);
        } catch (err) {
            console.error("加载房间失败:", err);
        }
    };

    useEffect(() => {
        if (isReady) {
            setIsLoading(true);
            fetchHouses().finally(() => setIsLoading(false));
        }
    }, [isReady]);

    useEffect(() => {
        if (selectedHouseId) {
            fetchRooms(selectedHouseId);
        } else {
            setRooms([]);
        }
    }, [selectedHouseId]);

    // House handlers
    const handleCreateHouse = () => {
        setEditingHouse(null);
        setIsHouseDialogOpen(true);
    };

    const handleEditHouse = (house) => {
        setEditingHouse(house);
        setIsHouseDialogOpen(true);
    };

    const handleSaveHouse = async (name) => {
        try {
            if (editingHouse) {
                await houseRepository.update(editingHouse.id, name);
            } else {
                const newId = await houseRepository.create(name);
                setSelectedHouseId(newId);
            }
            await fetchHouses();
            setIsHouseDialogOpen(false);
            setEditingHouse(null);
        } catch (err) {
            console.error("保存房子失败:", err);
            alert("保存房子失败,请重试。");
        }
    };

    const handleDeleteHouse = async (id) => {
        const house = houses.find(h => h.id === id);
        const confirmMsg = house.room_count > 0
            ? `确定要删除房子"${house.name}"吗？这将同时删除其下的 ${house.room_count} 个房间及所有相关数据!`
            : `确定要删除房子"${house.name}"吗？`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await houseRepository.delete(id);
            if (selectedHouseId === id) {
                setSelectedHouseId(null);
            }
            await fetchHouses();
        } catch (err) {
            console.error("删除房子失败:", err);
            alert("删除房子失败,请重试。");
        }
    };

    // Room handlers
    const handleCreateRoom = () => {
        if (!selectedHouseId) {
            alert("请先选择一个房子");
            return;
        }
        setEditingRoom(null);
        setIsRoomDialogOpen(true);
    };

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setIsRoomDialogOpen(true);
    };

    const handleSaveRoom = async (name) => {
        try {
            if (editingRoom) {
                await roomRepository.update(editingRoom.id, name);
            } else {
                await roomRepository.create(name, selectedHouseId);
            }
            await fetchRooms(selectedHouseId);
            await fetchHouses(); // 更新房间计数
            setIsRoomDialogOpen(false);
            setEditingRoom(null);
        } catch (err) {
            console.error("保存房间失败:", err);
            alert("保存房间失败,请重试。");
        }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm("确定要删除这个房间吗？所有单词和故事也将被删除。")) return;

        try {
            await roomRepository.delete(id);
            await fetchRooms(selectedHouseId);
            await fetchHouses(); // 更新房间计数
        } catch (err) {
            console.error("删除房间失败:", err);
            alert("删除房间失败,请重试。");
        }
    };

    if (!isReady || isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const selectedHouse = houses.find(h => h.id === selectedHouseId);

    return (
        <div className="animate-fade">
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>房间管理</h1>
                <p style={{ color: 'var(--text-muted)' }}>管理你的房子和房间,组织你的记忆空间</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '350px 1fr',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                <HouseList
                    houses={houses}
                    selectedHouseId={selectedHouseId}
                    onSelectHouse={setSelectedHouseId}
                    onEditHouse={handleEditHouse}
                    onDeleteHouse={handleDeleteHouse}
                    onCreateHouse={handleCreateHouse}
                />

                <RoomList
                    rooms={rooms}
                    houseName={selectedHouse?.name}
                    onEditRoom={handleEditRoom}
                    onDeleteRoom={handleDeleteRoom}
                    onCreateRoom={handleCreateRoom}
                />
            </div>

            <HouseDialog
                isOpen={isHouseDialogOpen}
                onClose={() => {
                    setIsHouseDialogOpen(false);
                    setEditingHouse(null);
                }}
                onSave={handleSaveHouse}
                editingHouse={editingHouse}
            />

            <RoomDialog
                isOpen={isRoomDialogOpen}
                onClose={() => {
                    setIsRoomDialogOpen(false);
                    setEditingRoom(null);
                }}
                onSave={handleSaveRoom}
                editingRoom={editingRoom}
            />
        </div>
    );
};

export default RoomsPage;

