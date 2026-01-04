import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Search, Star, Play, X, ChevronLeft, ChevronRight, Tag, ArrowRight, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
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

// Video Modal Component for Room Tours
const VideoModal = ({ isOpen, onClose, videoUrl, roomName }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('home-video-modal-container');
    if (container) {
      if (!document.fullscreenElement) {
        container.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(prog);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoRef.current.duration;
    }
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    setProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        onClick={handleClose}
      >
        <motion.div
          id="home-video-modal-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute -top-12 left-0 right-0 flex items-center justify-between">
            <h3 className="text-white font-display text-xl">
              Room Tour: {roomName}
            </h3>
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              data-testid="close-video-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Container */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl">
            {isYouTube ? (
              <iframe
                src={videoUrl?.replace('watch?v=', 'embed/') + '?autoplay=1'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Room Tour: ${roomName}`}
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                  data-testid="room-tour-video"
                />

                {/* Video Controls Overlay */}
                <div className="absolute inset-0 flex items-center justify-center group">
                  <button
                    onClick={togglePlay}
                    className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                    data-testid="video-play-pause"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div 
                    className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
                    onClick={handleSeek}
                  >
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      onClick={toggleFullscreen}
                      className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

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
  const [selectedVideo, setSelectedVideo] = useState({ url: '', name: '' });
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
  const offersRef = useRef(null);

  // Dummy offers data
  const offers = [
    {
      id: 1,
      title: 'Weekend Escape',
      description: 'Get 25% off for weekend stays. Valid for Friday-Sunday bookings.',
      code: 'WEEKEND25',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600',
      validUntil: '31 Jan 2026'
    },
    {
      id: 2,
      title: 'Early Bird Special',
      description: 'Book 30 days in advance and save 20% on any room type.',
      code: 'EARLYBIRD20',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600',
      validUntil: '28 Feb 2026'
    },
    {
      id: 3,
      title: 'Honeymoon Package',
      description: 'Romantic getaway with spa credits and dinner included.',
      code: 'HONEYMOON',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600',
      validUntil: '31 Mar 2026'
    },
    {
      id: 4,
      title: 'Family Fun',
      description: 'Kids stay free! Plus complimentary breakfast for the whole family.',
      code: 'FAMILYFUN',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
      validUntil: '30 Apr 2026'
    },
    {
      id: 5,
      title: 'Long Stay Discount',
      description: 'Stay 5 nights, pay only 4. Perfect for extended holidays.',
      code: 'LONGSTAY',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600',
      validUntil: '31 May 2026'
    }
  ];

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

  const scrollOffers = (direction) => {
    if (offersRef.current) {
      const scrollAmount = 320;
      offersRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-emerald-50/30">
      {/* Hero Section */}
      <section className="relative h-[100svh] min-h-[600px]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroContent?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920'})` 
          }}
        >
          <div className="absolute inset-0 hero-overlay" />
        </div>

        <div className="relative h-full flex flex-col justify-center items-center text-center px-4 pb-32 sm:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-emerald-300 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm mb-3 sm:mb-4">Welcome to</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6">
              {heroContent?.title || 'Spencer Green Hotel'}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-emerald-100 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              {heroContent?.subtitle || 'Experience Luxury in the Heart of Batu'}
            </p>
          </motion.div>
        </div>

        {/* Booking Engine - Desktop Only, positioned inside viewport */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="hidden md:block absolute bottom-8 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-4xl xl:max-w-5xl"
        >
          <div className="bg-white rounded-2xl shadow-luxury p-4 lg:p-6 mx-auto" data-testid="booking-engine">
            <div className="grid grid-cols-4 gap-3 lg:gap-4 items-end">
              {/* Check-in */}
              <div>
                <Label className="text-gray-600 mb-1.5 block text-sm">Check-in</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-testid="checkin-date-picker"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10 lg:h-12 text-sm",
                        !checkIn && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{checkIn ? format(checkIn, "dd MMM") : "Select"}</span>
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
                <Label className="text-gray-600 mb-1.5 block text-sm">Check-out</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-testid="checkout-date-picker"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10 lg:h-12 text-sm",
                        !checkOut && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{checkOut ? format(checkOut, "dd MMM") : "Select"}</span>
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
                <Label className="text-gray-600 mb-1.5 block text-sm">Guests</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    data-testid="guests-select"
                    className="w-full h-10 lg:h-12 pl-10 pr-4 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
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
                className="h-10 lg:h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">Search</span>
                    <span className="lg:hidden">Go</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Special Offers Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white" data-testid="offers-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-emerald-600 uppercase tracking-widest text-xs sm:text-sm mb-1 sm:mb-2">Limited Time</p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Special Offers</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scrollOffers('left')}
                className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors"
                data-testid="offers-scroll-left"
              >
                <ChevronLeft className="w-5 h-5 text-emerald-700" />
              </button>
              <button
                onClick={() => scrollOffers('right')}
                className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors"
                data-testid="offers-scroll-right"
              >
                <ChevronRight className="w-5 h-5 text-emerald-700" />
              </button>
            </div>
          </div>

          <div 
            ref={offersRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-[280px] sm:w-[300px] bg-white rounded-xl overflow-hidden shadow-soft border border-gray-100 snap-start"
                data-testid={`offer-card-${offer.id}`}
              >
                <div className="relative h-40 overflow-hidden">
                  <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {offer.code}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{offer.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Valid until {offer.validUntil}</span>
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center">
                      Book <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Rooms Section */}
      {showAvailability && (
        <section className="py-16 sm:py-20 bg-emerald-50/50" data-testid="available-rooms-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <p className="text-emerald-600 uppercase tracking-widest text-xs sm:text-sm mb-2">Available Rooms</p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {format(checkIn, 'dd MMM')} - {format(checkOut, 'dd MMM yyyy')}
              </h2>
            </div>

            {availableRooms.length === 0 ? (
              <p className="text-center text-gray-500">No rooms available for selected dates.</p>
            ) : (
              <div className="space-y-6">
                {availableRooms.map((room, index) => (
                  <motion.div
                    key={room.room_type_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl overflow-hidden shadow-soft"
                    data-testid={`room-card-${room.room_type_id}`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                      <div className="relative h-64 lg:h-auto overflow-hidden">
                        <img
                          src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                        {room.video_url && (
                          <button
                            onClick={() => handlePlayVideo(room.video_url)}
                            data-testid={`room-tour-btn-${room.room_type_id}`}
                            className="absolute top-4 right-4 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                          >
                            <Play className="w-5 h-5 text-emerald-600 ml-1" />
                          </button>
                        )}
                      </div>
                      <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display text-2xl font-semibold text-gray-900 mb-3">{room.name}</h3>
                          <p className="text-gray-500 mb-4 line-clamp-2">{room.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {room.amenities?.slice(0, 5).map((amenity, i) => (
                              <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div>
                            <span className="text-emerald-600 font-bold text-2xl">
                              Rp {(room.available_rate || room.base_price).toLocaleString('id-ID')}
                            </span>
                            <span className="text-gray-400 text-sm">/night</span>
                          </div>
                          <Button
                            onClick={() => handleBookRoom(room)}
                            data-testid={`book-room-btn-${room.room_type_id}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                          >
                            Book Now
                          </Button>
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

      {/* Promo Banner */}
      {promoBanner?.is_active && (
        <section className="py-12 sm:py-16 lg:py-20 bg-white" data-testid="promo-banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={promoBanner.image || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200'}
                alt="Promo"
                className="w-full h-56 sm:h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-transparent flex items-center">
                <div className="p-6 sm:p-8 md:p-12 max-w-lg">
                  <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                    {promoBanner.title}
                  </h3>
                  <p className="text-emerald-100 text-sm sm:text-base mb-4 sm:mb-6">{promoBanner.description}</p>
                  <Button className="bg-white text-emerald-800 hover:bg-emerald-100">
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Room Types Preview - Kempinski Style Full Width */}
      <section className="py-12 sm:py-16 lg:py-20 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-12">
          <div className="text-center">
            <p className="text-emerald-600 uppercase tracking-widest text-xs sm:text-sm mb-2">Accommodations</p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Our Rooms</h2>
          </div>
        </div>

        <div className="space-y-0">
          {rooms.slice(0, 3).map((room, index) => (
            <motion.div
              key={room.room_type_id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${index % 2 === 0 ? '' : ''}`}
            >
              <div className={`grid grid-cols-1 lg:grid-cols-2 ${index % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                <div className={`relative h-[50vh] min-h-[400px] ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={`flex items-center bg-white ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="p-8 sm:p-10 lg:p-16 max-w-xl mx-auto">
                    <p className="text-emerald-600 uppercase tracking-widest text-xs mb-3">
                      From Rp {room.base_price.toLocaleString('id-ID')} / night
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{room.name}</h3>
                    <p className="text-gray-500 leading-relaxed mb-6">{room.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {room.amenities?.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <Button 
                      onClick={() => handleBookRoom(room)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                    >
                      Book This Room
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-white" data-testid="reviews-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <p className="text-emerald-600 uppercase tracking-widest text-xs sm:text-sm mb-2">Testimonials</p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">What Our Guests Say</h2>
            </div>

            <div className="relative">
              <div className="bg-emerald-50/50 rounded-2xl p-6 sm:p-8 md:p-12">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < reviews[currentReviewIndex]?.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-base sm:text-lg italic mb-6">
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
