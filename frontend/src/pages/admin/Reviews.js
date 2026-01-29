import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/reviews`);
      setReviews(response.data);
    } catch (error) {
      toast.error('Error fetching reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Hapus review ini secara permanen?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/reviews/${reviewId}`);
      toast.success('Review berhasil dihapus');
      fetchReviews();
    } catch (error) {
      toast.error('Gagal menghapus review');
    }
  };

  const toggleVisibility = async (reviewId, currentVisibility) => {
    try {
      await axios.put(`${API_URL}/admin/reviews/${reviewId}/visibility?is_visible=${!currentVisibility}`);
      toast.success(currentVisibility ? 'Review hidden' : 'Review published');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div data-testid="reviews-page">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Review Tamu</h1>
        <p className="text-gray-500">Kelola review dari tamu hotel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-gray-500 text-sm">Total Review</p>
          <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-gray-500 text-sm">Ditampilkan</p>
          <p className="text-3xl font-bold text-emerald-600">
            {reviews.filter(r => r.is_visible).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-gray-500 text-sm">Menunggu Approval</p>
          <p className="text-3xl font-bold text-amber-600">
            {reviews.filter(r => !r.is_visible).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tamu</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="w-1/3">Komentar</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Belum ada review
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.review_id} data-testid={`review-row-${review.review_id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{review.guest_name}</p>
                      <p className="text-sm text-gray-500">{review.guest_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex">{renderStars(review.rating)}</div>
                  </TableCell>
                  <TableCell>
                    <p className="text-gray-600 line-clamp-2">{review.comment}</p>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {format(new Date(review.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${review.is_visible
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {review.is_visible ? 'Ditampilkan' : 'Tersembunyi'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user?.role === 'superadmin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReview(review.review_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Hapus Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(review.review_id, review.is_visible)}
                        className={review.is_visible ? 'text-amber-600' : 'text-emerald-600'}
                        data-testid={`toggle-review-${review.review_id}`}
                      >
                        {review.is_visible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Reviews;
