import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Calendar, ChevronLeft, ChevronRight, Image, Play, Users, DollarSign, Search, Link as LinkIcon } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import MediaUpload from '../../components/MediaUpload';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  
    // Inventory state
  const [viewMode, setViewMode] = useState('week');
  const [startDate, setStartDate] = useState(startOfToday());
  const [editingCell, setEditingCell] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [tempVideoUrl, setTempVideoUrl] = useState('');

  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    base_price: '',
    max_guests: '2',
    amenities: '',
    images: [],
    video_url: ''
  });

  const [bulkForm, setBulkForm] = useState({
    room_type_id: '',
    start_date: format(startOfToday(), 'yyyy-MM-dd'),
    end_date: format(addDays(startOfToday(), 7), 'yyyy-MM-dd'),
    allotment: '',
    rate: '',
    is_closed: 'unchanged'
  });

  const getToken = () => localStorage.getItem('token');

const openCloudinaryWidget = (type = 'image') => {
    if (!window.cloudinary) {
      toast.error("Library Cloudinary gagal dimuat. Cek index.html Anda.");
      return;
    }

    window.cloudinary.openMediaLibrary(
      {
        cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,

        insert_caption: 'Pilih Media Kamar',
        multiple: type === 'image', 
      },
      {
        insertHandler: (data) => {
          if (type === 'image') {
            const newUrls = data.assets.map(asset => asset.secure_url);
            setRoomForm(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
            toast.success(`${newUrls.length} Foto ditambahkan`);
          } else {
            setRoomForm(prev => ({ ...prev, video_url: data.assets[0].secure_url }));
            toast.success('Video berhasil dipilih');
          }
        }
      }
    );
  };

  const handleAddLinkImage = () => {
    if (!tempImageUrl) return;
    if (!tempImageUrl.startsWith('http')) {
      toast.error('Masukkan link URL yang valid');
      return;
    }
    setRoomForm(prev => ({ ...prev, images: [...prev.images, tempImageUrl] }));
    setTempImageUrl('');
    toast.success('Link gambar berhasil ditambahkan');
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
      if (response.data.length > 0 && !bulkForm.room_type_id) {
        setBulkForm(prev => ({ ...prev, room_type_id: response.data[0].room_type_id }));
      }
    } catch (error) {
      toast.error('Error fetching rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async () => {
    const days = viewMode === 'week' ? 7 : 30;
    const endDate = addDays(startDate, days);
    
    try {
      const response = await axios.get(`${API_URL}/inventory`, {
        params: {
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd')
        }
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (rooms.length > 0) {
      fetchInventory();
    }
  }, [rooms, startDate, viewMode]);

  // Room CRUD functions
  const openCreateRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      name: '',
      description: '',
      base_price: '',
      max_guests: '2',
      amenities: '',
      images: [],
      video_url: ''
    });
    setShowRoomModal(true);
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name,
      description: room.description,
      base_price: room.base_price?.toString() || '',
      max_guests: room.max_guests?.toString() || '2',
      amenities: room.amenities?.join(', ') || '',
      images: room.images || [],
      video_url: room.video_url || ''
    });
    setShowRoomModal(true);
  };

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const moveImage = (index, direction) => {
  const newImages = [...roomForm.images];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= newImages.length) return;

  [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

  setRoomForm({ ...roomForm, images: newImages });
  toast.info(`Urutan diperbarui: Foto ke-${targetIndex + 1} sekarang jadi foto ${targetIndex === 0 ? 'Utama' : ''}`);
};

  const saveRoom = async () => {
    if (!roomForm.name || !roomForm.base_price) {
      toast.error('Nama dan harga wajib diisi');
      return;
    }

    const roomData = {
      name: roomForm.name,
      description: roomForm.description,
      base_price: parseFloat(roomForm.base_price),
      max_guests: parseInt(roomForm.max_guests),
      amenities: roomForm.amenities.split(',').map(a => a.trim()).filter(a => a),
      images: roomForm.images,
      video_url: roomForm.video_url
    };

    try {
      if (editingRoom) {
        await axios.put(`${API_URL}/admin/rooms/${editingRoom.room_type_id}`, roomData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        toast.success('Kamar berhasil diupdate');
      } else {
        await axios.post(`${API_URL}/admin/rooms`, roomData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        toast.success('Kamar baru berhasil dibuat');
      }
      setShowRoomModal(false);
      fetchRooms();
    } catch (error) {
      toast.error('Gagal menyimpan kamar');
    }
  };

  const deleteRoom = async () => {
    try {
      await axios.delete(`${API_URL}/admin/rooms/${roomToDelete.room_type_id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Kamar berhasil dihapus');
      setShowDeleteModal(false);
      setRoomToDelete(null);
      fetchRooms();
    } catch (error) {
      toast.error('Gagal menghapus kamar');
    }
  };

  const handleImageUpload = (mediaData) => {
    setRoomForm(prev => ({
      ...prev,
      images: [...prev.images, mediaData.secure_url]
    }));
    setShowImageUpload(false);
    toast.success('Gambar berhasil diupload');
  };

  const handleVideoUpload = (mediaData) => {
    setRoomForm(prev => ({
      ...prev,
      video_url: mediaData.secure_url
    }));
    setShowVideoUpload(false);
    toast.success('Video berhasil diupload');
  };

  const removeImage = (index) => {
    setRoomForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Inventory functions
  const getDays = () => {
    const days = viewMode === 'week' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => addDays(startDate, i));
  };

  const getInventoryForDate = (roomId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return inventory.find(inv => inv.room_type_id === roomId && inv.date === dateStr);
  };

  const handleCellUpdate = async (roomId, date, field, value) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = getInventoryForDate(roomId, date);
    const room = rooms.find(r => r.room_type_id === roomId);
    
    const updateData = {
      room_type_id: roomId,
      date: dateStr,
      allotment: existing?.allotment ?? 5,
      rate: existing?.rate ?? room?.base_price ?? 500000,
      is_closed: existing?.is_closed ?? false,
      [field]: field === 'is_closed' ? value === 'true' : Number(value)
    };

    try {
      await axios.post(`${API_URL}/admin/inventory`, updateData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Updated');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to update');
    }
    setEditingCell(null);
  };

  const handleBulkUpdate = async () => {
    if (!bulkForm.room_type_id) {
      toast.error('Pilih tipe kamar');
      return;
    }

    try {
      const payload = {
        room_type_id: bulkForm.room_type_id,
        start_date: bulkForm.start_date,
        end_date: bulkForm.end_date,
        allotment: bulkForm.allotment ? Number(bulkForm.allotment) : null,
        rate: bulkForm.rate ? Number(bulkForm.rate) : null,
        is_closed: bulkForm.is_closed === 'yes' ? true : bulkForm.is_closed === 'no' ? false : null
      };

      await axios.post(`${API_URL}/admin/inventory/bulk-update`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Bulk update berhasil');
      setShowBulkModal(false);
      fetchInventory();
    } catch (error) {
      toast.error('Bulk update gagal');
    }
  };

  const navigateDates = (direction) => {
    const days = viewMode === 'week' ? 7 : 30;
    if (direction === 'prev') {
      setStartDate(addDays(startDate, -days));
    } else {
      setStartDate(addDays(startDate, days));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div data-testid="room-management">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Kelola Kamar</h1>
        <p className="text-gray-500">Buat, edit, dan kelola tipe kamar serta inventory</p>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="bg-white shadow-soft">
          <TabsTrigger value="rooms">Tipe Kamar</TabsTrigger>
          <TabsTrigger value="inventory">Inventory & Harga</TabsTrigger>
        </TabsList>

        {/* Room Types Tab */}
        <TabsContent value="rooms" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={openCreateRoom}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="create-room-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kamar Baru
            </Button>
          </div>

          <div className="grid gap-6">
            {rooms.map((room) => (
              <div
                key={room.room_type_id}
                className="bg-white rounded-xl shadow-soft overflow-hidden"
                data-testid={`room-card-${room.room_type_id}`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-4">
                  {/* Room Image */}
                  <div className="relative h-48 lg:h-auto">
                    <img
                      src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                    {room.video_url && (
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        Video
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-white/90 text-xs px-2 py-1 rounded-full">
                      {room.images?.length || 0} foto
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="lg:col-span-2 p-6">
                    <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">{room.name}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{room.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Max {room.max_guests} tamu
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Rp {room.base_price?.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {room.amenities?.slice(0, 5).map((amenity, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities?.length > 5 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{room.amenities.length - 5} lainnya
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 flex flex-col justify-center gap-2 border-l border-gray-100">
                    <Button
                      onClick={() => openEditRoom(room)}
                      variant="outline"
                      className="w-full"
                      data-testid={`edit-room-${room.room_type_id}`}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        setRoomToDelete(room);
                        setShowDeleteModal(true);
                      }}
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      data-testid={`delete-room-${room.room_type_id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {rooms.length === 0 && (
              <div className="bg-white rounded-xl shadow-soft p-12 text-center">
                <p className="text-gray-500 mb-4">Belum ada tipe kamar</p>
                <Button onClick={openCreateRoom} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Kamar Pertama
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32" data-testid="view-mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week View</SelectItem>
                  <SelectItem value="month">Month View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setShowBulkModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="bulk-update-btn"
            >
              Bulk Update
            </Button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-soft">
            <button onClick={() => navigateDates('prev')} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="prev-dates-btn">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span className="font-medium">
                {format(startDate, 'dd MMM yyyy')} - {format(addDays(startDate, viewMode === 'week' ? 6 : 29), 'dd MMM yyyy')}
              </span>
            </div>

            <button onClick={() => navigateDates('next')} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="next-dates-btn">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-medium text-gray-700 min-w-[150px]">Tipe Kamar</th>
                    <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[60px]">Field</th>
                    {getDays().map((day) => (
                      <th key={day.toISOString()} className="px-2 py-3 text-center font-medium text-gray-700 min-w-[80px]">
                        <div className="text-xs text-gray-400">{format(day, 'EEE')}</div>
                        <div>{format(day, 'dd')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <React.Fragment key={room.room_type_id}>
                      {/* Allotment Row */}
                      <tr className="border-t">
                        <td className="sticky left-0 bg-white px-4 py-2 font-medium text-gray-900" rowSpan={3}>{room.name}</td>
                        <td className="px-2 py-2 text-sm text-gray-500">Allot</td>
                        {getDays().map((day) => {
                          const inv = getInventoryForDate(room.room_type_id, day);
                          const cellKey = `${room.room_type_id}-${format(day, 'yyyy-MM-dd')}-allotment`;
                          return (
                            <td key={cellKey} className="px-1 py-1 text-center">
                              {editingCell === cellKey ? (
                                <Input type="number" defaultValue={inv?.allotment ?? 5} className="w-16 h-8 text-center text-sm" autoFocus onBlur={(e) => handleCellUpdate(room.room_type_id, day, 'allotment', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCellUpdate(room.room_type_id, day, 'allotment', e.target.value); else if (e.key === 'Escape') setEditingCell(null); }} />
                              ) : (
                                <button onClick={() => setEditingCell(cellKey)} className={`w-full py-1 text-sm rounded transition-colors ${inv?.is_closed ? 'bg-red-100 text-red-600' : 'hover:bg-emerald-50'}`}>{inv?.allotment ?? 5}</button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Rate Row */}
                      <tr key={`${room.room_type_id}-rate`}>
                        <td className="px-2 py-2 text-sm text-gray-500">Rate</td>
                        {getDays().map((day) => {
                          const inv = getInventoryForDate(room.room_type_id, day);
                          const cellKey = `${room.room_type_id}-${format(day, 'yyyy-MM-dd')}-rate`;
                          const rate = inv?.rate ?? room.base_price;
                          return (
                            <td key={cellKey} className="px-1 py-1 text-center">
                              {editingCell === cellKey ? (
                                <Input type="number" defaultValue={rate} className="w-20 h-8 text-center text-xs" autoFocus onBlur={(e) => handleCellUpdate(room.room_type_id, day, 'rate', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCellUpdate(room.room_type_id, day, 'rate', e.target.value); else if (e.key === 'Escape') setEditingCell(null); }} />
                              ) : (
                                <button onClick={() => setEditingCell(cellKey)} className={`w-full py-1 text-xs rounded transition-colors ${inv?.is_closed ? 'bg-red-100 text-red-600' : 'hover:bg-emerald-50'}`}>{(rate / 1000).toFixed(0)}K</button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Close Out Row */}
                      <tr key={`${room.room_type_id}-closeout`} className="border-b">
                        <td className="px-2 py-2 text-sm text-gray-500">Close</td>
                        {getDays().map((day) => {
                          const inv = getInventoryForDate(room.room_type_id, day);
                          return (
                            <td key={`${room.room_type_id}-${format(day, 'yyyy-MM-dd')}-close`} className="px-1 py-1 text-center">
                              <button onClick={() => handleCellUpdate(room.room_type_id, day, 'is_closed', inv?.is_closed ? 'false' : 'true')} className={`w-full py-1 text-xs rounded transition-colors ${inv?.is_closed ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                                {inv?.is_closed ? <X className="w-4 h-4 mx-auto" /> : '-'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Room Modal */}
      <Dialog open={showRoomModal} onOpenChange={setShowRoomModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Kamar' : 'Tambah Kamar Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nama Kamar *</Label>
                <Input
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="e.g., Superior Room"
                  data-testid="room-name-input"
                />
              </div>

              <div>
                <Label>Harga Dasar (Rp) *</Label>
                <Input
                  type="number"
                  value={roomForm.base_price}
                  onChange={(e) => setRoomForm({ ...roomForm, base_price: e.target.value })}
                  placeholder="e.g., 850000"
                  data-testid="room-price-input"
                />
              </div>

              <div>
                <Label>Max Tamu</Label>
                <Select value={roomForm.max_guests} onValueChange={(v) => setRoomForm({ ...roomForm, max_guests: v })}>
                  <SelectTrigger data-testid="room-guests-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} Tamu</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  placeholder="Deskripsi kamar..."
                  rows={3}
                  data-testid="room-description-input"
                />
              </div>

              <div className="col-span-2">
                <Label>Fasilitas (pisahkan dengan koma)</Label>
                <Input
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                  placeholder="e.g., AC, WiFi, TV, Mini Bar"
                  data-testid="room-amenities-input"
                />
              </div>
            </div>


            {/* Images Section */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4" />
                Foto Kamar
              </Label>
              
              {roomForm.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {roomForm.images.map((img, idx) => (
                    <div key={idx} className="relative group border-2 border-transparent hover:border-emerald-500 rounded-lg overflow-hidden transition-all">
                      <img src={img} alt={`Room ${idx + 1}`} className="w-full h-20 object-cover" />
                      {idx === 0 && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">FOTO UTAMA</div>}
                      <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5">{idx + 1}</div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                        <button onClick={() => moveImage(idx, 'up')} disabled={idx === 0} className="p-1 bg-white text-emerald-700 rounded-full disabled:opacity-30"><ChevronLeft className="w-3 h-3" /></button>
                        <button onClick={() => moveImage(idx, 'down')} disabled={idx === roomForm.images.length - 1} className="p-1 bg-white text-emerald-700 rounded-full disabled:opacity-30"><ChevronRight className="w-3 h-3" /></button>
                        <button onClick={() => removeImage(idx)} className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Fitur Baru: Link & Browse Cloudinary */}
              <div className="flex gap-2 mb-3">
                <Input placeholder="Paste URL Cloudinary Gambar..." value={tempImageUrl} onChange={(e) => setTempImageUrl(e.target.value)} />
                <Button type="button" variant="secondary" onClick={handleAddLinkImage}><LinkIcon className="w-4 h-4 mr-2" /> Link</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" onClick={() => setShowImageUpload(true)} className="w-full" data-testid="upload-room-image-btn"><Plus className="w-4 h-4 mr-2" /> Tambah Foto</Button>
                <Button type="button" variant="outline" className="w-full border-emerald-200 hover:bg-emerald-50 text-emerald-700" onClick={() => openCloudinaryWidget('image')}><Search className="w-4 h-4 mr-2" /> Browse Cloudinary</Button>
              </div>
            </div>

            {/* Video Section */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Play className="w-4 h-4" />
                Video Room Tour
              </Label>
              
              {roomForm.video_url ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <video src={roomForm.video_url} className="w-32 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 truncate">{roomForm.video_url}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setRoomForm({ ...roomForm, video_url: '' })}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="Paste URL Video..." value={tempVideoUrl} onChange={(e) => setTempVideoUrl(e.target.value)} />
                    <Button type="button" variant="secondary" onClick={() => { setRoomForm({...roomForm, video_url: tempVideoUrl}); setTempVideoUrl(''); }}>Set Link</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowVideoUpload(true)} className="w-full" data-testid="upload-room-video-btn"><Plus className="w-4 h-4 mr-2" /> Tambah Video</Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => openCloudinaryWidget('video')}><Search className="w-4 h-4 mr-2" /> Browse Video</Button>
                  </div>
                </div>
                )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowRoomModal(false)}>
                Batal
              </Button>
              <Button onClick={saveRoom} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="save-room-btn">
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Kamar?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500">
            Apakah Anda yakin ingin menghapus <strong>{roomToDelete?.name}</strong>? 
            Kamar ini akan dinonaktifkan dan tidak tampil di booking engine.
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button onClick={deleteRoom} className="flex-1 bg-red-600 hover:bg-red-700 text-white" data-testid="confirm-delete-btn">
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Update</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Tipe Kamar</Label>
              <Select value={bulkForm.room_type_id} onValueChange={(v) => setBulkForm({ ...bulkForm, room_type_id: v })}>
                <SelectTrigger data-testid="bulk-room-select">
                  <SelectValue placeholder="Pilih tipe kamar" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.room_type_id} value={room.room_type_id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Mulai</Label>
                <Input type="date" value={bulkForm.start_date} onChange={(e) => setBulkForm({ ...bulkForm, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Tanggal Akhir</Label>
                <Input type="date" value={bulkForm.end_date} onChange={(e) => setBulkForm({ ...bulkForm, end_date: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Allotment (kosongkan jika tidak diubah)</Label>
              <Input type="number" value={bulkForm.allotment} onChange={(e) => setBulkForm({ ...bulkForm, allotment: e.target.value })} placeholder="e.g., 5" />
            </div>

            <div>
              <Label>Rate (kosongkan jika tidak diubah)</Label>
              <Input type="number" value={bulkForm.rate} onChange={(e) => setBulkForm({ ...bulkForm, rate: e.target.value })} placeholder="e.g., 850000" />
            </div>

            <div>
              <Label>Close Out</Label>
              <Select value={bulkForm.is_closed} onValueChange={(v) => setBulkForm({ ...bulkForm, is_closed: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unchanged">Tidak diubah</SelectItem>
                  <SelectItem value="yes">Close (Tutup)</SelectItem>
                  <SelectItem value="no">Open (Buka)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleBulkUpdate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Upload Modal */}
      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Foto Kamar</DialogTitle>
          </DialogHeader>
          <MediaUpload
            uploadEndpoint={
    editingRoom 
      ? `/media/upload/room-image?room_type_id=${editingRoom.room_type_id}&filename=${slugify(roomForm.name)}` 
      : `/media/upload/gallery?category=rooms&filename=${slugify(roomForm.name || 'kamar-baru')}`
  }
  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
  maxFileSize={10 * 1024 * 1024}
  title="Upload Foto Kamar"
  description="Max 10MB. Nama file akan otomatis disesuaikan dengan nama kamar."
  onUploadSuccess={handleImageUpload}
/>
        </DialogContent>
      </Dialog>

      {/* Video Upload Modal */}
      <Dialog open={showVideoUpload} onOpenChange={setShowVideoUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Video Room Tour</DialogTitle>
          </DialogHeader>
          <MediaUpload
            uploadEndpoint={editingRoom ? `/media/upload/room-video?room_type_id=${editingRoom.room_type_id}` : "/media/upload/gallery?category=videos"}
            acceptedTypes={['video/mp4', 'video/quicktime']}
            maxFileSize={500 * 1024 * 1024}
            title="Upload Room Tour Video"
            description="Max 500MB, MP4/MOV"
            onUploadSuccess={handleVideoUpload}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManagement;
