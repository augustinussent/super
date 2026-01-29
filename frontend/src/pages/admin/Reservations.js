import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, CheckCircle, XCircle, LogIn, LogOut, Mail, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchQuery, statusFilter]);

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/reservations`);
      setReservations(response.data);
    } catch (error) {
      toast.error('Error fetching reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReservation = async (reservationId) => {
    if (!window.confirm('APAKAH ANDA YAKIN? Data reservasi ini akan dihapus PERMANEN dan tidak bisa dikembalikan.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/reservations/${reservationId}`);
      toast.success('Reservasi berhasil dihapus permanen');
      fetchReservations(); // Refresh list
    } catch (error) {
      toast.error('Gagal menghapus reservasi: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.guest_name.toLowerCase().includes(query) ||
        r.booking_code.toLowerCase().includes(query) ||
        r.guest_email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredReservations(filtered);
  };

  const updateStatus = async (reservationId, newStatus) => {
    try {
      await axios.put(`${API_URL}/admin/reservations/${reservationId}/status?status=${newStatus}`);
      toast.success('Status updated');
      fetchReservations();
      setShowDetailModal(false);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resendEmail = async (reservationId) => {
    setIsSendingEmail(true);
    try {
      await axios.post(`${API_URL}/admin/reservations/${reservationId}/resend-email`);
      toast.success('Email berhasil dikirim');
    } catch (error) {
      toast.error('Gagal mengirim email: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-emerald-100 text-emerald-800';
      case 'checked_out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'checked_in': return <LogIn className="w-4 h-4" />;
      case 'checked_out': return <LogOut className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
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
    <div data-testid="reservations-page">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Daftar Reservasi</h1>
        <p className="text-gray-500">Kelola semua reservasi hotel</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari nama, kode booking, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-reservations"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="status-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Booking</TableHead>
              <TableHead>Tamu</TableHead>
              <TableHead>Tipe Kamar</TableHead>
              <TableHead>Check-in/out</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Tidak ada reservasi ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredReservations.map((reservation) => (
                <TableRow key={reservation.reservation_id} data-testid={`reservation-row-${reservation.reservation_id}`}>
                  <TableCell className="font-mono text-sm font-medium">
                    {reservation.booking_code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{reservation.guest_name}</p>
                      <p className="text-sm text-gray-500">{reservation.guest_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{reservation.room_type_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(reservation.check_in), 'dd MMM')}</p>
                      <p className="text-gray-500">{format(new Date(reservation.check_out), 'dd MMM')}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    Rp {reservation.total_amount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      {reservation.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Super Admin Delete Button */}
                      {user?.role === 'superadmin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReservation(reservation.reservation_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setShowDetailModal(true);
                        }}
                        data-testid={`view-reservation-${reservation.reservation_id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Reservasi</DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-6">
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-sm text-emerald-600">Kode Booking</p>
                <p className="text-xl font-bold text-emerald-800">{selectedReservation.booking_code}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nama Tamu</p>
                  <p className="font-medium">{selectedReservation.guest_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedReservation.guest_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telepon</p>
                  <p className="font-medium">{selectedReservation.guest_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipe Kamar</p>
                  <p className="font-medium">{selectedReservation.room_type_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-in</p>
                  <p className="font-medium">{format(new Date(selectedReservation.check_in), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="font-medium">{format(new Date(selectedReservation.check_out), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jumlah Tamu</p>
                  <p className="font-medium">{selectedReservation.guests} orang</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jumlah Malam</p>
                  <p className="font-medium">{selectedReservation.nights} malam</p>
                </div>
              </div>

              {selectedReservation.special_requests && (
                <div>
                  <p className="text-sm text-gray-500">Permintaan Khusus</p>
                  <p className="font-medium">{selectedReservation.special_requests}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    Rp {selectedReservation.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
                {selectedReservation.discount_amount > 0 && (
                  <p className="text-sm text-emerald-500 text-right">
                    Diskon: Rp {selectedReservation.discount_amount.toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Ubah Status</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedReservation.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStatus(selectedReservation.reservation_id, status)}
                      className={selectedReservation.status === status ? 'bg-emerald-600' : ''}
                      data-testid={`status-btn-${status}`}
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => resendEmail(selectedReservation.reservation_id)}
                  disabled={isSendingEmail}
                  className="w-full"
                  data-testid="resend-email-btn"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  {isSendingEmail ? 'Mengirim...' : 'Kirim Ulang Email Konfirmasi'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reservations;
