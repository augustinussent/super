import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, User, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Define all available permissions
const PERMISSIONS_LIST = [
  { key: 'dashboard', label: 'Dashboard', description: 'Lihat statistik dan ringkasan' },
  { key: 'rooms', label: 'Kelola Kamar', description: 'CRUD tipe kamar & inventory' },
  { key: 'reservations', label: 'Reservasi', description: 'Kelola booking & status' },
  { key: 'content', label: 'Konten', description: 'Edit konten halaman website' },
  { key: 'reviews', label: 'Reviews', description: 'Moderasi review tamu' },
  { key: 'promo', label: 'Promo Codes', description: 'Kelola kode promo' },
  { key: 'users', label: 'Pengguna', description: 'Kelola user & hak akses' },
  { key: 'gallery', label: 'Gallery', description: 'Kelola foto & video' },
  { key: 'email_config', label: 'Email Config', description: 'Kelola template & pengaturan email' }
];

// Default permissions by role
const DEFAULT_PERMISSIONS = {
  superadmin: {
    dashboard: true, rooms: true, reservations: true, content: true,
    reviews: true, promo: true, users: true, gallery: true, email_config: true
  },
  admin: {
    dashboard: true, rooms: true, reservations: true, content: true,
    reviews: true, promo: true, users: false, gallery: true, email_config: true
  },
  staff: {
    dashboard: true, rooms: false, reservations: true, content: false,
    reviews: false, promo: false, users: false, gallery: false, email_config: false
  }
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    permissions: { ...DEFAULT_PERMISSIONS.staff }
  });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
      permissions: { ...DEFAULT_PERMISSIONS[role] }
    });
  };

  const handlePermissionChange = (key, checked) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: checked
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Nama dan email wajib diisi');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password wajib diisi untuk user baru');
      return;
    }

    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        await axios.put(`${API_URL}/admin/users/${editingUser.user_id}`, updateData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        toast.success('User berhasil diupdate');
      } else {
        await axios.post(`${API_URL}/auth/register`, formData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        toast.success('User baru berhasil dibuat');
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'staff', permissions: { ...DEFAULT_PERMISSIONS.staff } });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operasi gagal');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      permissions: user.permissions || DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.staff
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;

    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('User berhasil dihapus');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus user');
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin' || role === 'superadmin') {
      return <Shield className="w-4 h-4 text-emerald-600" />;
    }
    return <User className="w-4 h-4 text-gray-400" />;
  };

  const getPermissionCount = (user) => {
    const perms = user.permissions || DEFAULT_PERMISSIONS[user.role] || {};
    return Object.values(perms).filter(v => v === true).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div data-testid="users-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Pengguna</h1>
          <p className="text-gray-500">Kelola akun pengguna dan hak akses</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'staff', permissions: { ...DEFAULT_PERMISSIONS.staff } });
            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="add-user-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Hak Akses</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Tidak ada pengguna
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.user_id} data-testid={`user-row-${user.user_id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {user.role === 'superadmin' ? 'Super Admin' :
                        user.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {getPermissionCount(user)} dari {PERMISSIONS_LIST.length} akses
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        data-testid={`edit-user-${user.user_id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.user_id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-user-${user.user_id}`}
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
            <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama lengkap"
                  data-testid="user-name-input"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="user-email-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">
                  Password {editingUser ? '(kosongkan jika tidak diubah)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  data-testid="user-password-input"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <Label className="text-base font-semibold mb-4 block">Hak Akses</Label>
              <p className="text-sm text-gray-500 mb-4">
                Pilih fitur yang dapat diakses oleh user ini
              </p>

              <div className="grid grid-cols-2 gap-3">
                {PERMISSIONS_LIST.map((perm) => (
                  <div
                    key={perm.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${formData.permissions[perm.key]
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Checkbox
                      id={`perm-${perm.key}`}
                      checked={formData.permissions[perm.key] || false}
                      onCheckedChange={(checked) => handlePermissionChange(perm.key, checked)}
                      data-testid={`perm-${perm.key}`}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`perm-${perm.key}`}
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        {perm.label}
                        {formData.permissions[perm.key] && (
                          <Check className="w-3 h-3 text-emerald-600" />
                        )}
                      </label>
                      <p className="text-xs text-gray-500">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  permissions: Object.fromEntries(PERMISSIONS_LIST.map(p => [p.key, true]))
                })}
              >
                Pilih Semua
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  permissions: Object.fromEntries(PERMISSIONS_LIST.map(p => [p.key, false]))
                })}
              >
                Hapus Semua
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  permissions: { ...DEFAULT_PERMISSIONS[formData.role] }
                })}
              >
                Reset ke Default
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="save-user-btn"
            >
              {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
