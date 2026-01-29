import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Search, Star, Play, X, ChevronLeft, ChevronRight, Tag, ArrowRight, Pause, Volume2, VolumeX, Maximize2, Images, Check, MapPin, Coffee, Wifi, Utensils, Waves, Tag as TagIcon, AlertCircle } from 'lucide-react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import axios from 'axios';
import { trackEvent, trackBookNow, trackViewRoom } from '../../utils/analytics';
import { toast } from 'sonner';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';
import ImageGalleryOverlay from '../../components/ImageGalleryOverlay';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Video Modal Component for Room Tours
const VideoModal = ({ isOpen, onClose, videoUrl, roomName }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        onClick={handleClose}
      >
        {/* Close Button - Fixed at top right */}
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 z-[60] w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
          data-testid="close-video-modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Room Name - Fixed at top left */}
        <div className="fixed top-4 left-4 z-[60]">
          <h3 className="text-white font-display text-lg drop-shadow-lg">
            Room Tour: {roomName}
          </h3>
        </div>

        <motion.div
          id="home-video-modal-container"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Video Container - Fullscreen */}
          <div className="relative bg-black w-full h-full flex items-center justify-center group">
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
                <div className="absolute inset-0 flex items-center justify-center">
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
  const [heroContent, setHeroContent] = useState({
    title: 'Spencer Green Hotel',
    subtitle: 'Hotel view pegunungan di Batu Malang untuk Liburan & Corporate Event',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920'
  });
  const [promoBanner, setPromoBanner] = useState({
    title: 'Special Weekend Offer',
    description: 'Get 20% off for weekend stays. Use code: WEEKEND20',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200',
    is_active: true
  });
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
    promo_code: '',
    rate_plan_id: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const offersRef = useRef(null);
  const roomsRef = useRef(null);
  const bookingEngineRef = useRef(null);
  const [showMobileBooking, setShowMobileBooking] = useState(false);

  const scrollToBooking = () => {
    if (bookingEngineRef.current) {
      const headerOffset = 100;
      const elementPosition = bookingEngineRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Gallery state
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryRoomName, setGalleryRoomName] = useState('');

  const openGallery = (room, startIndex = 0) => {
    if (room.images && room.images.length > 0) {
      setGalleryImages(room.images);
      setGalleryIndex(startIndex);
      setGalleryRoomName(room.name);
      setShowGallery(true);
    }
  };

  // Dynamic offers from API
  const [offers, setOffers] = useState([]);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [verifiedPromo, setVerifiedPromo] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchContent();
    fetchReviews();
    fetchRooms();
    fetchOffers();
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
      if (response.data && response.data.length > 0) {
        setReviews(response.data);
      } else {
        // Fallback dummy reviews
        setReviews([
          {
            guest_name: "Budi Santoso",
            rating: 5,
            comment: "Pelayanan sangat memuaskan, kamar bersih dan pemandangan indah. Sangat recommended untuk liburan keluarga."
          },
          {
            guest_name: "Siti Aminah",
            rating: 5,
            comment: "Makanan enak, lokasi strategis dekat tempat wisata. Staff ramah dan sangat membantu."
          },
          {
            guest_name: "John Doe",
            rating: 4,
            comment: "Great view and friendly staff. Will definitely come back again when visiting Batu."
          }
        ]);
      }
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

  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${API_URL}/special-offers`);
      setOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const searchAvailability = async () => {
    setIsSearching(true);
    try {
      // Pass verification data if exists (for price consistency)
      const response = await axios.get(`${API_URL}/availability`, {
        params: {
          check_in: format(checkIn, 'yyyy-MM-dd'),
          check_out: format(checkOut, 'yyyy-MM-dd')
        }
      });
      setAvailableRooms(response.data);
      setShowAvailability(true);

      // Scroll to rooms section with offset for header
      setTimeout(() => {
        if (roomsRef.current) {
          const headerOffset = 100;
          const elementPosition = roomsRef.current.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 100);
    } catch (error) {
      toast.error('Error searching availability');
    } finally {
      setIsSearching(false);
    }
  };

  const verifyPromoCode = async () => {
    if (!promoCode) return;
    setIsVerifying(true);
    try {
      const response = await axios.post(`${API_URL}/promo/verify`, {
        code: promoCode,
        check_in: format(checkIn, 'yyyy-MM-dd')
      });

      if (response.data.valid) {
        setVerifiedPromo(response.data);
        toast.success(response.data.message || 'Kode promo berhasil digunakan!');
      }
    } catch (error) {
      setVerifiedPromo(null);
      toast.error(error.response?.data?.detail || 'Kode promo tidak valid');
    } finally {
      setIsVerifying(false);
    }
  };

  const getDiscountedPrice = (room, originalPrice) => {
    if (!verifiedPromo) return originalPrice;

    // Check if promo implies specific rooms
    if (verifiedPromo.room_type_ids && verifiedPromo.room_type_ids.length > 0) {
      if (!verifiedPromo.room_type_ids.includes(room.room_type_id)) {
        return originalPrice;
      }
    }

    if (verifiedPromo.discount_type === 'percent') {
      return originalPrice * (1 - verifiedPromo.discount_value / 100);
    } else {
      return Math.max(0, originalPrice - verifiedPromo.discount_value);
    }
  };

  const handleCheckInSelect = (date) => {
    setCheckIn(date);
    // Always default check-out to H+1 when check-in changes
    setCheckOut(addDays(date, 1));
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);

    // Default to first plan if available, or 'standard'
    const defaultPlanId = room.rate_plans && room.rate_plans.length > 0
      ? room.rate_plans[0].rate_plan_id
      : 'standard';

    setBookingForm(prev => ({
      ...prev,
      rate_plan_id: defaultPlanId,
      promo_code: verifiedPromo ? verifiedPromo.code : prev.promo_code
    }));
    setShowBookingModal(true);
  };

  const handlePlayVideo = (room) => {
    const videoUrl = room.video_url || 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';
    setSelectedVideo({ url: videoUrl, name: room.name });
    setShowVideoModal(true);
  };

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    guest_name: '',
    guest_email: '',
    rating: 5,
    comment: ''
  });

  const submitReview = async () => {
    if (!reviewForm.guest_name || !reviewForm.guest_email || !reviewForm.comment) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/reviews`, {
        ...reviewForm,
        reservation_id: '' // Optional
      });
      toast.success('Review submitted successfully! Pending approval.');
      setShowReviewModal(false);
      setReviewForm({ guest_name: '', guest_email: '', rating: 5, comment: '' });
    } catch (error) {
      toast.error('Failed to submit review');
    }
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
        guests: 1 // Default
      });

      toast.success('Booking successful! Check your email for confirmation.');
      setShowBookingModal(false);
      setBookingForm({ guest_name: '', guest_email: '', guest_phone: '', special_requests: '', promo_code: '', rate_plan_id: '' });

      const waNumber = '6281130700206';
      const message = `Halo Spencer Green Hotel, saya baru saja melakukan booking via website.\n\nBooking Code: ${response.data.booking_code}\nNama: ${response.data.guest_name}\nCheck-in: ${response.data.check_in}`;
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
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative h-[85vh] sm:h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image/Video */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Luxury Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto -mt-20 sm:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-emerald-300 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm mb-3 sm:mb-4">Hotel dengan View Pegunungan dekat Wisata Selecta</p>
            {/* SEO H1 - Hidden but indexable */}
            <h1 className="sr-only">SPENCER GREEN HOTEL BATU – Hotel di Batu Malang dengan Kamar Nyaman, Kolam Renang & Paket Meeting</h1>
            {/* Visual Title */}
            <p className="font-display hero-title text-4xl sm:text-5xl text-white mb-4 sm:mb-6" role="heading" aria-level="2">
              {heroContent?.title}
            </p>
            <p className="hero-subtitle text-base sm:text-lg lg:text-xl text-emerald-100 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              {heroContent?.subtitle}
            </p>
            <Sheet open={showMobileBooking} onOpenChange={setShowMobileBooking}>
              <SheetTrigger asChild>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-6 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                  Book Now
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-lg font-display">Find Your Room</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  {/* Check-in Input */}
                  <div>
                    <Label className="text-gray-600 mb-1.5 block text-sm">Check-in</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-12"
                        >
                          <Calendar className="mr-2 h-4 w-4 text-emerald-600" />
                          {checkIn ? format(checkIn, 'dd MMM yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={checkIn}
                          onSelect={handleCheckInSelect}
                          disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Check-out Input */}
                  <div>
                    <Label className="text-gray-600 mb-1.5 block text-sm">Check-out</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-12"
                        >
                          <Calendar className="mr-2 h-4 w-4 text-emerald-600" />
                          {checkOut ? format(checkOut, 'dd MMM yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) => date <= checkIn}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Guests Input */}
                  <div>
                    <Label className="text-gray-600 mb-1.5 block text-sm">Guests</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                      <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full h-12 pl-10 pr-4 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        {[1, 2, 3, 4].map(n => (
                          <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <div>
                    <Label className="text-gray-600 mb-1.5 block text-sm">Promo Code</Label>
                    <div className="relative flex">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <TagIcon className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Kode Promo"
                        className="w-full h-12 pl-10 pr-24 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm uppercase"
                      />
                      <button
                        onClick={verifyPromoCode}
                        disabled={isVerifying || !promoCode}
                        className="absolute right-2 top-2 bottom-2 px-3 bg-emerald-50 text-emerald-600 rounded-md text-xs font-medium hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {isVerifying ? 'Checking...' : verifiedPromo ? <div className="flex items-center"><Check className="w-3 h-3 mr-1" /> Applied</div> : 'Verify'}
                      </button>
                    </div>
                    {verifiedPromo && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        Code applied! Discount: {verifiedPromo.discount_type === 'percent' ? `${verifiedPromo.discount_value}%` : `Rp ${verifiedPromo.discount_value}`}
                      </p>
                    )}
                  </div>

                  {/* Search Button */}
                  <Button
                    onClick={() => {
                      searchAvailability();
                      setShowMobileBooking(false);
                    }}
                    disabled={isSearching}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Availability
                      </>
                    )}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>
        </div>

        {/* Booking Engine - Desktop Only, positioned inside viewport */}
        <motion.div
          ref={bookingEngineRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          // PERBAIKAN TOTAL: Gunakan inset-x-0 dan mx-auto agar elemen otomatis di tengah tanpa perlu translate-x
          className="hidden absolute bottom-8 inset-x-0 z-30 px-4"
        >
          <div
            className="bg-white rounded-2xl shadow-luxury p-4 lg:p-6 mx-auto w-[85%] max-w-4xl border border-emerald-100/50"
            data-testid="booking-engine"
          >
            <div className="grid grid-cols-5 gap-3 lg:gap-4 items-end">
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
                      disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
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
                      disabled={(date) => date <= checkIn}
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

              {/* Promo Code Input Desktop */}
              <div className="hidden lg:block">
                <Label className="text-gray-600 mb-1.5 block text-sm">Promo Code</Label>
                <div className="relative flex">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <TagIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Kode Promo"
                    className="w-full h-10 lg:h-12 pl-10 pr-20 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm uppercase"
                  />
                  <button
                    onClick={verifyPromoCode}
                    disabled={isVerifying || !promoCode}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-50 text-emerald-600 rounded-md text-xs font-medium hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {isVerifying ? '...' : verifiedPromo ? <Check className="w-4 h-4" /> : 'Verify'}
                  </button>
                </div>
                {verifiedPromo && (
                  <p className="text-[10px] text-emerald-600 mt-1 absolute font-medium">
                    Hemat {verifiedPromo.discount_type === 'percent' ? `${verifiedPromo.discount_value}%` : `Rp ${verifiedPromo.discount_value}`}
                  </p>
                )}
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
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-gray-900">Special Offers</h2>
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
                    <button
                      onClick={scrollToBooking}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center"
                    >
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
        <section ref={roomsRef} className="py-16 sm:py-20 bg-emerald-50/50" data-testid="available-rooms-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <p className="text-emerald-600 uppercase tracking-widest text-xs sm:text-sm mb-2">Available Rooms</p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-gray-900">
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
                      <div className="relative h-64 lg:h-auto overflow-hidden group cursor-pointer" onClick={() => openGallery(room, 0)}>
                        <img
                          src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                          alt={room.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Photo count badge */}
                        {room.images && room.images.length > 1 && (
                          <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                            <Images className="w-4 h-4" />
                            {room.images.length} Foto
                          </div>
                        )}
                        {/* Room Tour Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayVideo(room);
                          }}
                          data-testid={`room-tour-btn-${room.room_type_id}`}
                          className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 hover:bg-white text-emerald-700 px-4 py-2 rounded-full transition-all shadow-lg hover:shadow-xl"
                        >
                          <Play className="w-5 h-5" />
                          <span className="font-medium text-sm">Room Tour</span>
                        </button>
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                          <div>
                            {verifiedPromo ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 line-through">
                                    Rp {(room.available_rate || room.base_price).toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                                    Hemat {verifiedPromo.discount_type === 'percent' ? `${verifiedPromo.discount_value}%` : ''}
                                  </span>
                                </div>
                                <span className="text-emerald-600 font-bold text-2xl">
                                  Rp {getDiscountedPrice(room, room.available_rate || room.base_price).toLocaleString('id-ID')}
                                </span>
                              </>
                            ) : (
                              <span className="text-emerald-600 font-bold text-2xl">
                                Rp {(room.available_rate || room.base_price).toLocaleString('id-ID')}
                              </span>
                            )}
                            <span className="text-gray-400 text-sm">/night</span>
                          </div>
                          <div className="flex items-center gap-3">
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
                src={promoBanner.image}
                alt="Promo"
                className="w-full h-56 sm:h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-transparent flex items-center">
                <div className="p-6 sm:p-8 md:p-12 max-w-lg">
                  <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-medium text-white mb-3 sm:mb-4">
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
            <p className="text-emerald-600 uppercase tracking-widest text-xs sm:text-sm mb-2">Akomodasi</p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Pilihan Kamar Nyaman Kami</h2>
          </div>
        </div>

        <div className="space-y-0">
          {rooms.map((room, index) => (
            <motion.div
              key={room.room_type_id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${index % 2 === 0 ? '' : ''}`}
            >
              <div className={`grid grid-cols-1 lg:grid-cols-2 ${index % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                <div className={`relative h-[50vh] min-h-[400px] ${index % 2 === 1 ? 'lg:col-start-2' : ''} group`}>
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Room Tour Button */}
                  <button
                    onClick={() => {
                      trackEvent('Content', 'play_video', room.name);
                      handlePlayVideo(room);
                    }}
                    data-testid={`home-room-tour-btn-${room.room_type_id}`}
                    className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/90 hover:bg-white text-emerald-700 px-5 py-3 rounded-full transition-all shadow-lg hover:shadow-xl"
                  >
                    <Play className="w-5 h-5" />
                    <span className="font-medium">Room Tour</span>
                  </button>
                </div>
                <div className={`flex items-center bg-white ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="p-8 sm:p-10 lg:p-16 max-w-xl">
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
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => {
                          trackBookNow(room.name);
                          handleBookRoom(room);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                      >
                        Book Now
                      </Button>
                    </div>
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
              <p className="text-emerald-600 uppercase tracking-widest text-xs sm:text-sm mb-2">Testimoni</p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Pengalaman Menginap Tamu Kami</h2>
              <Button
                variant="outline"
                onClick={() => setShowReviewModal(true)}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                Pengalaman Menginap Anda
              </Button>
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
                  &ldquo;{reviews[currentReviewIndex]?.comment}&rdquo;
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
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{selectedRoom.name}</h4>
                  <p className="text-sm text-gray-500 mb-1">
                    {format(checkIn, 'dd MMM')} - {format(checkOut, 'dd MMM yyyy')}
                  </p>

                  {/* Rate Plan Selector */}
                  {selectedRoom.rate_plans && selectedRoom.rate_plans.length > 1 && (
                    <div className="mb-2">
                      <select
                        value={bookingForm.rate_plan_id}
                        onChange={(e) => setBookingForm({ ...bookingForm, rate_plan_id: e.target.value })}
                        className="text-xs p-1 border rounded bg-white w-full"
                      >
                        {selectedRoom.rate_plans.map(plan => (
                          <option key={plan.rate_plan_id} value={plan.rate_plan_id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(() => {
                    const selectedPlan = selectedRoom.rate_plans?.find(p => p.rate_plan_id === bookingForm.rate_plan_id)
                      || selectedRoom.rate_plans?.[0]
                      || { nightly_price: selectedRoom.available_rate || selectedRoom.base_price };

                    const pricePerNight = selectedPlan.nightly_price;

                    return verifiedPromo ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 line-through">
                          Rp {pricePerNight.toLocaleString('id-ID')}
                        </span>
                        <span className="text-emerald-600 font-bold">
                          Rp {getDiscountedPrice(selectedRoom, pricePerNight).toLocaleString('id-ID')}/night
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Promo Applied: {verifiedPromo.code}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-emerald-600 font-bold">
                          Rp {pricePerNight.toLocaleString('id-ID')}/night
                        </span>
                        {selectedPlan.description && (
                          <span className="text-[10px] text-gray-500">{selectedPlan.description}</span>
                        )}
                      </div>
                    );
                  })()}
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
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoUrl={selectedVideo.url}
        roomName={selectedVideo.name}
      />

      {/* Image Gallery Overlay */}
      <ImageGalleryOverlay
        images={galleryImages}
        initialIndex={galleryIndex}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        roomName={galleryRoomName}
      />

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="rv_name">Name *</Label>
              <Input
                id="rv_name"
                value={reviewForm.guest_name}
                onChange={(e) => setReviewForm({ ...reviewForm, guest_name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="rv_email">Email *</Label>
              <Input
                id="rv_email"
                type="email"
                value={reviewForm.guest_email}
                onChange={(e) => setReviewForm({ ...reviewForm, guest_email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="rv_comment">Share your experience *</Label>
              <textarea
                id="rv_comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                placeholder="Tell us about your stay..."
              />
            </div>
            <Button
              onClick={submitReview}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Mobile Booking Sticky Bar - Restricted Width to avoid WhatsApp Button */}
      <div className="md:hidden fixed bottom-0 left-0 hover:w-[85%] transition-all w-[80%] z-40 bg-white border-t border-r border-gray-200 shadow-lg p-3 safe-area-bottom rounded-tr-xl">
        <div className="flex items-center justify-between gap-3">
          {/* Swapped positions: Button on LEFT to avoid WhatsApp overlap (Right), Text on RIGHT */}
          <Sheet open={showMobileBooking} onOpenChange={setShowMobileBooking}>
            <SheetTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
                <Search className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-lg font-display">Find Your Room</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                {/* Check-in Mobile */}
                <div>
                  <Label className="text-gray-600 mb-1.5 block text-sm">Check-in</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-12"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-emerald-600" />
                        {checkIn ? format(checkIn, 'dd MMM yyyy') : 'Select date'}
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

                {/* Check-out Mobile */}
                <div>
                  <Label className="text-gray-600 mb-1.5 block text-sm">Check-out</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-12"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-emerald-600" />
                        {checkOut ? format(checkOut, 'dd MMM yyyy') : 'Select date'}
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

                {/* Guests Mobile */}
                <div>
                  <Label className="text-gray-600 mb-1.5 block text-sm">Guests</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full h-12 pl-10 pr-4 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Promo Code Mobile */}
                <div>
                  <Label className="text-gray-600 mb-1.5 block text-sm">Promo Code</Label>
                  <div className="relative flex">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <TagIcon className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Kode Promo"
                      className="w-full h-12 pl-10 pr-24 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm uppercase"
                    />
                    <button
                      onClick={verifyPromoCode}
                      disabled={isVerifying || !promoCode}
                      className="absolute right-2 top-2 bottom-2 px-3 bg-emerald-50 text-emerald-600 rounded-md text-xs font-medium hover:bg-emerald-100 disabled:opacity-50"
                    >
                      {isVerifying ? 'Checking...' : verifiedPromo ? <div className="flex items-center"><Check className="w-3 h-3 mr-1" /> Applied</div> : 'Verify'}
                    </button>
                  </div>
                  {verifiedPromo && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                      Code applied! Discount: {verifiedPromo.discount_type === 'percent' ? `${verifiedPromo.discount_value}%` : `Rp ${verifiedPromo.discount_value}`}
                    </p>
                  )}
                </div>

                {/* Search Button Mobile */}
                <Button
                  onClick={() => {
                    searchAvailability();
                    setShowMobileBooking(false);
                  }}
                  disabled={isSearching}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Availability
                    </>
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-right">
            <p className="text-xs text-gray-500">Check availability</p>
            <p className="text-sm font-medium text-gray-900">
              {format(checkIn, 'dd MMM')} - {format(checkOut, 'dd MMM')} · {guests} guest{guests > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;