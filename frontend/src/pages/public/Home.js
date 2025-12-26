import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Search, Star, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Home = () => {
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(addDays(new Date(), 1));
  const [guests, setGuests] = useState(2);
  const [heroContent, setHeroContent] = useState(null);
  const [promoBanner, setPromoBanner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    special_requests: '',
    promo_code: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    fetchContent();
    fetchReviews();
    fetchRooms();
    initData();
  }, []);

  const initData = async () => {
    try {
      await axios.post(`${API_URL}/init`);
    } catch (error) {
      // Already initialized
    }
  };

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/home`);
      const hero = response.data.find(c => c.section === 'hero');
      const promo = response.data.find(c => c.section === 'promo_banner');
      if (hero) setHeroContent(hero.content);
      if (promo) setPromoBanner(promo.content);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
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

  const searchAvailability = async () => {
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_URL}/availability`, {
        params: {
          check_in: format(checkIn, 'yyyy-MM-dd'),
          check_out: format(checkOut, 'yyyy-MM-dd')
        }
      });
      setAvailableRooms(response.data);
      setShowAvailability(true);
    } catch (error) {
      toast.error('Error searching availability');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckInSelect = (date) => {
    setCheckIn(date);
    if (date >= checkOut) {
      setCheckOut(addDays(date, 1));
    }
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handlePlayVideo = (url) => {
    setVideoUrl(url || 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    setShowVideoModal(true);
  };

  const submitBooking = async () => {
    if (!bookingForm.guest_name || !bookingForm.guest_email || !bookingForm.guest_phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsBooking(true);
    try {
      const response = await axios.post(`${API_URL}/reservations`, {
        ...bookingForm,
        room_type_id: selectedRoom.room_type_id,
        check_in: format(checkIn, 'yyyy-MM-dd'),
        check_out: format(checkOut, 'yyyy-MM-dd'),
        guests
      });
      
      toast.success('Booking successful! Check your email for confirmation.');
      setShowBookingModal(false);
      setBookingForm({ guest_name: '', guest_email: '', guest_phone: '', special_requests: '', promo_code: '' });
      
      // Redirect to WhatsApp
      const waNumber = '6281334480210';
      const message = `Hi, I just made a booking with code ${response.data.booking_code}. I would like to complete the payment.`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroContent?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920'})` 
          }}
        >
          <div className="absolute inset-0 hero-overlay" />
        </div>

        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-emerald-300 uppercase tracking-[0.3em] text-sm mb-4">Welcome to</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              {heroContent?.title || 'Spencer Green Hotel'}
            </h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-8">
              {heroContent?.subtitle || 'Experience Luxury in the Heart of Batu'}
            </p>
          </motion.div>
        </div>

        {/* Booking Engine - Desktop Only */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4"
        >
          <div className="bg-white rounded-2xl shadow-luxury p-6" data-testid="booking-engine">
            <div className="grid grid-cols-4 gap-4 items-end">
              {/* Check-in */}
              <div>
                <Label className="text-gray-600 mb-2 block">Check-in</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-testid="checkin-date-picker"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !checkIn && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-emerald-600" />
                      {checkIn ? format(checkIn, "dd MMM yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={checkIn}
                      onSelect={handleCheckInSelect}
                      disabled={(date) => isBefore(date, startOfToday())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Check-out */}
              <div>
                <Label className="text-gray-600 mb-2 block">Check-out</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-testid="checkout-date-picker"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !checkOut && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-emerald-600" />
                      {checkOut ? format(checkOut, "dd MMM yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      disabled={(date) => isBefore(date, addDays(checkIn, 1))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Guests */}
              <div>
                <Label className="text-gray-600 mb-2 block">Guests</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    data-testid="guests-select"
                    className="w-full h-12 pl-10 pr-4 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <Button
                onClick={searchAvailability}
                disabled={isSearching}
                data-testid="search-availability-btn"
                className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Available Rooms Section */}
      {showAvailability && (
        <section className="py-24 bg-white" data-testid="available-rooms-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">Available Rooms</p>
              <h2 className="font-display text-4xl font-bold text-gray-900">
                {format(checkIn, 'dd MMM')} - {format(checkOut, 'dd MMM yyyy')}
              </h2>
            </div>

            {availableRooms.length === 0 ? (
              <p className="text-center text-gray-500">No rooms available for selected dates.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableRooms.map((room) => (
                  <motion.div
                    key={room.room_type_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl overflow-hidden shadow-soft card-hover"
                    data-testid={`room-card-${room.room_type_id}`}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                        alt={room.name}
                        className="w-full h-full object-cover img-zoom"
                      />
                      {room.video_url && (
                        <button
                          onClick={() => handlePlayVideo(room.video_url)}
                          data-testid={`room-tour-btn-${room.room_type_id}`}
                          className="absolute top-4 right-4 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Play className="w-5 h-5 text-emerald-600 ml-1" />
                        </button>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">{room.name}</h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{room.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-emerald-600 font-bold text-lg">
                            Rp {(room.available_rate || room.base_price).toLocaleString('id-ID')}
                          </span>
                          <span className="text-gray-400 text-sm">/night</span>
                        </div>
                        <Button
                          onClick={() => handleBookRoom(room)}
                          data-testid={`book-room-btn-${room.room_type_id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Promo Banner */}
      {promoBanner?.is_active && (
        <section className="py-20 md:pt-32 bg-emerald-50" data-testid="promo-banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={promoBanner.image || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200'}
                alt="Promo"
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-transparent flex items-center">
                <div className="p-8 md:p-12 max-w-lg">
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                    {promoBanner.title}
                  </h3>
                  <p className="text-emerald-100 mb-6">{promoBanner.description}</p>
                  <Button 
                    onClick={() => document.querySelector('[data-testid="booking-engine"]')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white text-emerald-800 hover:bg-emerald-100"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Room Types Preview */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">Accommodations</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">Our Rooms</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rooms.slice(0, 3).map((room, index) => (
              <motion.div
                key={room.room_type_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={() => handleBookRoom(room)}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4">
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                    alt={room.name}
                    className="w-full h-full object-cover img-zoom"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                </div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-1">{room.name}</h3>
                <p className="text-emerald-600 font-medium">
                  From Rp {room.base_price.toLocaleString('id-ID')}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-24 bg-emerald-50" data-testid="reviews-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">Testimonials</p>
              <h2 className="font-display text-4xl font-bold text-gray-900">What Our Guests Say</h2>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-soft">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < reviews[currentReviewIndex]?.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-lg italic mb-6">
                  "{reviews[currentReviewIndex]?.comment}"
                </p>
                <p className="font-semibold text-gray-900">{reviews[currentReviewIndex]?.guest_name}</p>
              </div>

              {reviews.length > 1 && (
                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    onClick={prevReview}
                    className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 transition-colors"
                    data-testid="prev-review-btn"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={nextReview}
                    className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 transition-colors"
                    data-testid="next-review-btn"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Complete Your Booking</DialogTitle>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-emerald-50 rounded-lg">
                <img
                  src={selectedRoom.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200'}
                  alt={selectedRoom.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedRoom.name}</h4>
                  <p className="text-sm text-gray-500">
                    {format(checkIn, 'dd MMM')} - {format(checkOut, 'dd MMM yyyy')}
                  </p>
                  <p className="text-emerald-600 font-bold">
                    Rp {(selectedRoom.available_rate || selectedRoom.base_price).toLocaleString('id-ID')}/night
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="guest_name">Full Name *</Label>
                  <Input
                    id="guest_name"
                    data-testid="booking-guest-name"
                    value={bookingForm.guest_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, guest_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="guest_email">Email *</Label>
                  <Input
                    id="guest_email"
                    type="email"
                    data-testid="booking-guest-email"
                    value={bookingForm.guest_email}
                    onChange={(e) => setBookingForm({ ...bookingForm, guest_email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="guest_phone">Phone *</Label>
                  <Input
                    id="guest_phone"
                    data-testid="booking-guest-phone"
                    value={bookingForm.guest_phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, guest_phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="promo_code">Promo Code</Label>
                  <Input
                    id="promo_code"
                    data-testid="booking-promo-code"
                    value={bookingForm.promo_code}
                    onChange={(e) => setBookingForm({ ...bookingForm, promo_code: e.target.value })}
                    placeholder="Enter promo code (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="special_requests">Special Requests</Label>
                  <textarea
                    id="special_requests"
                    data-testid="booking-special-requests"
                    value={bookingForm.special_requests}
                    onChange={(e) => setBookingForm({ ...bookingForm, special_requests: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Any special requests?"
                  />
                </div>
              </div>

              <Button
                onClick={submitBooking}
                disabled={isBooking}
                data-testid="confirm-booking-btn"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
              >
                {isBooking ? 'Processing...' : 'Confirm Booking'}
              </Button>

              <p className="text-sm text-gray-500 text-center">
                You will be redirected to WhatsApp to complete payment
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl p-0">
          <button
            onClick={() => setShowVideoModal(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="aspect-video">
            <iframe
              src={videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
