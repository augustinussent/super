import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Calendar, Phone, Mail, User, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const CheckReservation = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const checkIfAdmin = async () => {
    if (!email || bookingCode) {
      setShowPasswordField(false);
      return;
    }

    setIsCheckingAdmin(true);
    try {
      // Try to check if this email is an admin
      const response = await axios.post(`${API_URL}/auth/login`, { 
        email, 
        password: 'check-only-invalid' 
      });
      // If we get here, something unexpected happened
      setShowPasswordField(false);
    } catch (error) {
      // If error is "Invalid credentials", the email exists as admin
      if (error.response?.status === 401 && error.response?.data?.detail === 'Invalid credentials') {
        setShowPasswordField(true);
      } else {
        setShowPasswordField(false);
      }
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  const handleEmailBlur = () => {
    if (!bookingCode && email) {
      checkIfAdmin();
    }
  };

  const handleBookingCodeChange = (value) => {
    setBookingCode(value.toUpperCase());
    if (value) {
      setShowPasswordField(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsSearching(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    // If password field is shown, try admin login
    if (showPasswordField && password) {
      await handleAdminLogin();
      return;
    }

    if (!bookingCode && !email) {
      toast.error('Please enter booking code or email');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (bookingCode) params.append('booking_code', bookingCode);
      if (email) params.append('email', email);

      const response = await axios.get(`${API_URL}/reservations/check?${params.toString()}`);
      setReservations(response.data);
      
      if (response.data.length === 0) {
        toast.info('No reservations found');
      }
    } catch (error) {
      toast.error('Error searching reservation');
    } finally {
      setIsSearching(false);
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

  return (
    <div className="pt-20 min-h-screen bg-emerald-50/30">
      {/* Hero */}
      <section className="bg-emerald-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl font-bold text-white mb-4">Check Your Reservation</h1>
            <p className="text-emerald-200">Enter your booking code or email to view your reservation details</p>
          </motion.div>
        </div>
      </section>

      {/* Search Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-soft p-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="bookingCode">Booking Code</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="bookingCode"
                    value={bookingCode}
                    onChange={(e) => handleBookingCodeChange(e.target.value)}
                    placeholder="e.g., SGH-20250101-ABC123"
                    className="pl-10"
                    data-testid="booking-code-input"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-200" />
                <span className="px-4 text-gray-400 text-sm">or</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="Enter your email"
                    className="pl-10"
                    data-testid="email-input"
                  />
                </div>
              </div>

              {/* Password Field - Only shown for admin emails */}
              {showPasswordField && !bookingCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                    <p className="text-emerald-800 text-sm">
                      This email is registered as staff/admin. Enter your password to access the dashboard.
                    </p>
                  </div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>
              )}

              <Button
                onClick={handleSearch}
                disabled={isSearching || isCheckingAdmin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
                data-testid="search-reservation-btn"
              >
                {isSearching || isCheckingAdmin ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : showPasswordField && !bookingCode ? (
                  'Login to Dashboard'
                ) : (
                  'Search Reservation'
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      {hasSearched && !showPasswordField && (
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4">
            {reservations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No reservations found. Please check your booking code or email.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reservations.map((reservation) => (
                  <motion.div
                    key={reservation.reservation_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-soft overflow-hidden"
                    data-testid={`reservation-card-${reservation.reservation_id}`}
                  >
                    <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm">Booking Code</p>
                        <p className="text-white font-bold text-lg">{reservation.booking_code}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                        {reservation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <User className="w-5 h-5 text-emerald-600 mt-0.5" />
                            <div>
                              <p className="text-gray-500 text-sm">Guest Name</p>
                              <p className="font-medium text-gray-900">{reservation.guest_name}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                            <div>
                              <p className="text-gray-500 text-sm">Room Type</p>
                              <p className="font-medium text-gray-900">{reservation.room_type_name}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
                            <div>
                              <p className="text-gray-500 text-sm">Check-in / Check-out</p>
                              <p className="font-medium text-gray-900">
                                {format(new Date(reservation.check_in), 'dd MMM yyyy')} - {format(new Date(reservation.check_out), 'dd MMM yyyy')}
                              </p>
                              <p className="text-gray-500 text-sm">{reservation.nights} night(s)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm">Total Amount</p>
                            <p className="text-emerald-600 font-bold text-2xl">
                              Rp {reservation.total_amount.toLocaleString('id-ID')}
                            </p>
                            {reservation.discount_amount > 0 && (
                              <p className="text-emerald-500 text-sm">
                                Saved Rp {reservation.discount_amount.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                          {reservation.status === 'pending' && (
                            <a
                              href={`https://wa.me/6281334480210?text=Hi,%20I%20want%20to%20complete%20payment%20for%20booking%20${reservation.booking_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center bg-green-500 text-white px-6 py-3 rounded-full font-medium hover:bg-green-600 transition-colors"
                              data-testid="complete-payment-btn"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Complete Payment
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default CheckReservation;
