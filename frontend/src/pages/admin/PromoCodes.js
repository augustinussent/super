import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';
import { Checkbox } from '../../components/ui/checkbox';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const PromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    max_usage: '',
    room_type_ids: [],
    valid_days: [],
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    is_active: true
  });

  useEffect(() => {
    fetchPromoCodes();
    fetchRooms();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/promo-codes`);
      setPromoCodes(response.data);
    } catch (error) {
      toast.error('Error fetching promo codes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.discount_value || !formData.max_usage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        max_usage: Number(formData.max_usage)
      };

      if (editingPromo) {
        await axios.put(`${API_URL}/admin/promo-codes/${editingPromo.promo_id}`, payload);
        toast.success('Promo code updated');
      } else {
        await axios.post(`${API_URL}/admin/promo-codes`, payload);
        toast.success('Promo code created');
      }

      setShowModal(false);
      setEditingPromo(null);
      resetForm();
      fetchPromoCodes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: '',
      max_usage: '',
      room_type_ids: [],
      valid_days: [],
      valid_from: format(new Date(), 'yyyy-MM-dd'),
      valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      is_active: true
    });
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      max_usage: promo.max_usage.toString(),
      room_type_ids: promo.room_type_ids || [],
      valid_days: promo.valid_days || [],
      valid_from: promo.valid_from.split('T')[0],
      valid_until: promo.valid_until.split('T')[0],
      is_active: promo.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await axios.delete(`${API_URL}/admin/promo-codes/${promoId}`);
      toast.success('Promo code deleted');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  const toggleActive = async (promo) => {
    try {
      await axios.put(`${API_URL}/admin/promo-codes/${promo.promo_id}`, {
        is_active: !promo.is_active
      });
      toast.success('Status updated');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to update status');
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
    <div data-testid="promo-codes-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Kode Promo</h1>
          <p className="text-gray-500">Kelola kode promo untuk booking engine</p>
        </div>
        <Button
          onClick={() => {
            setEditingPromo(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="add-promo-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Promo
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Diskon</TableHead>
              <TableHead>Penggunaan</TableHead>
              <TableHead>Berlaku</TableHead>
              <TableHead>Kamar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Belum ada kode promo
                </TableCell>
              </TableRow>
            ) : (
              promoCodes.map((promo) => (
                <TableRow key={promo.promo_id} data-testid={`promo-row-${promo.promo_id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono font-bold">{promo.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {promo.discount_type === 'percent' ? (
                        <>
                          <Percent className="w-4 h-4 text-amber-500" />
                          <span>{promo.discount_value}%</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 text-amber-500" />
                          <span>Rp {promo.discount_value.toLocaleString('id-ID')}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={promo.current_usage >= promo.max_usage ? 'text-red-500' : ''}>
                      {promo.current_usage} / {promo.max_usage}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{format(new Date(promo.valid_from), 'dd MMM')}</p>
                    <p className="text-gray-500">{format(new Date(promo.valid_until), 'dd MMM yyyy')}</p>
                  </TableCell>
                  <TableCell>
                    {promo.room_type_ids?.length > 0
                      ? `${promo.room_type_ids.length} kamar`
                      : 'Semua kamar'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={promo.is_active}
                      onCheckedChange={() => toggleActive(promo)}
                      data-testid={`toggle-promo-${promo.promo_id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(promo)}
                        data-testid={`edit-promo-${promo.promo_id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(promo.promo_id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-promo-${promo.promo_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Kode Promo' : 'Tambah Kode Promo'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="code">Kode Promo *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., WEEKEND20"
                  data-testid="promo-code-input"
                />
              </div>

              <div>
                <Label>Tipe Diskon</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger data-testid="discount-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discount_value">Nilai Diskon *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percent' ? '20' : '100000'}
                  data-testid="discount-value-input"
                />
              </div>

              <div>
                <Label htmlFor="max_usage">Maksimal Penggunaan *</Label>
                <Input
                  id="max_usage"
                  type="number"
                  value={formData.max_usage}
                  onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                  placeholder="100"
                  data-testid="max-usage-input"
                />
              </div>

              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                    data-testid="is-active-switch"
                  />
                  <Label htmlFor="is_active">Status Aktif</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="valid_from">Berlaku Dari</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  data-testid="valid-from-input"
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Berlaku Sampai</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  data-testid="valid-until-input"
                />
              </div>
            </div>

            {/* Day of Week Filter */}
            <div className="border-t pt-4">
              <Label className="mb-2 block font-medium">Berlaku di Hari (kosongkan = semua hari)</Label>
              <div className="flex flex-wrap gap-2">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, idx) => (
                  <label key={idx} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                    <Checkbox
                      checked={formData.valid_days.includes(idx)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, valid_days: [...formData.valid_days, idx] });
                        } else {
                          setFormData({ ...formData, valid_days: formData.valid_days.filter(d => d !== idx) });
                        }
                      }}
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Room Selection */}
            <div className="border-t pt-4">
              <Label className="mb-2 block font-medium">Berlaku untuk Kamar</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2 bg-gray-50/50">
                <label className="flex items-center gap-2 p-1.5 cursor-pointer hover:bg-white rounded transition-colors">
                  <Checkbox
                    checked={formData.room_type_ids.length === 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, room_type_ids: [] });
                      }
                    }}
                  />
                  <span className="text-sm font-medium">Semua Kamar</span>
                </label>
                {rooms.map((room) => (
                  <label key={room.room_type_id} className="flex items-center gap-2 p-1.5 cursor-pointer hover:bg-white rounded transition-colors">
                    <Checkbox
                      checked={formData.room_type_ids.includes(room.room_type_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, room_type_ids: [...formData.room_type_ids, room.room_type_id] });
                        } else {
                          setFormData({ ...formData, room_type_ids: formData.room_type_ids.filter(id => id !== room.room_type_id) });
                        }
                      }}
                    />
                    <span className="text-sm">{room.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 sticky bottom-0 bg-white">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="save-promo-btn"
              >
                {editingPromo ? 'Simpan Perubahan' : 'Buat Kode Promo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodes;
