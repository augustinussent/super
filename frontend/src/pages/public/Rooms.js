import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Users, Maximize2, Volume2, VolumeX, Pause, Images } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import ImageGalleryOverlay from '../../components/ImageGalleryOverlay';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const VideoModal = ({ isOpen, onClose, videoUrl, roomName }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
    const container = document.getElementById('video-modal-container');
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
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
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

  // Check if it's a YouTube URL
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
          id="video-modal-container"
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
                  {/* Center Play/Pause Button */}
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
                  {/* Progress Bar */}
                  <div
                    className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                        data-testid="video-mute"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={toggleFullscreen}
                      className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                      data-testid="video-fullscreen"
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

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState({ url: '', name: '' });
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryRoomName, setGalleryRoomName] = useState('');
  const [heroContent, setHeroContent] = useState(null);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchHeroContent = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/rooms`);
      const hero = response.data.find(c => c.section === 'hero');
      if (hero) setHeroContent(hero.content);
    } catch (error) {
      console.error('Error fetching hero content:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchHeroContent();
  }, []);

  const handlePlayVideo = (room) => {
    const videoUrl = room.video_url || 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';
    setSelectedVideo({ url: videoUrl, name: room.name });
    setShowVideoModal(true);
  };

  const openGallery = (room, startIndex = 0) => {
    if (room.images && room.images.length > 0) {
      setGalleryImages(room.images);
      setGalleryIndex(startIndex);
      setGalleryRoomName(room.name);
      setShowGallery(true);
    }
  };

  return (
    <div className="bg-emerald-50/30 pt-16 sm:pt-18 lg:pt-20">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroContent?.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1920'})` }}
        >
          <div className="absolute inset-0 bg-emerald-950/60" />
        </div>
        <div className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-emerald-300 uppercase tracking-widest text-sm mb-2">Accommodations</p>
            {/* SEO H1 - Hidden but indexable */}
            <h1 className="sr-only">Pilihan Tipe Kamar Spencer Green Hotel Batu</h1>
            {/* Visual Title */}
            <p className="font-display text-5xl font-bold text-white" role="heading" aria-level="2">Our Rooms</p>
          </motion.div>
        </div>
      </section>

      {/* Rooms List */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {rooms.map((room, index) => (
              <motion.div
                key={room.room_type_id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                data-testid={`room-detail-${room.room_type_id}`}
              >
                {/* Room Image with Video Overlay */}
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  {/* Main Image */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer" onClick={() => openGallery(room, 0)}>
                    <img
                      src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                      alt={room.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      {/* Photo count badge */}
                      {room.images && room.images.length > 1 && (
                        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                          <Images className="w-4 h-4" />
                          {room.images.length} Foto
                        </div>
                      )}

                      {/* Video badge */}
                      {room.video_url && (
                        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                          <Play className="w-4 h-4" />
                          Video
                        </div>
                      )}

                      {/* Room Tour Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVideo(room);
                        }}
                        data-testid={`room-video-btn-${room.room_type_id}`}
                        className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 hover:bg-white text-emerald-700 px-4 py-2 rounded-full transition-all shadow-lg hover:shadow-xl"
                      >
                        <Play className="w-5 h-5" />
                        <span className="font-medium text-sm">Room Tour</span>
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Strip */}
                  {room.images && room.images.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {room.images.slice(0, 5).map((img, imgIdx) => (
                        <button
                          key={imgIdx}
                          onClick={() => openGallery(room, imgIdx)}
                          className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-emerald-500 ${imgIdx === 0 ? 'ring-2 ring-emerald-500' : ''
                            }`}
                          data-testid={`room-thumb-${room.room_type_id}-${imgIdx}`}
                        >
                          <img src={img} alt={`${room.name} ${imgIdx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {room.images.length > 5 && (
                        <button
                          onClick={() => openGallery(room, 5)}
                          className="flex-shrink-0 w-16 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-medium hover:bg-emerald-200 transition-colors"
                        >
                          +{room.images.length - 5}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Room Details */}
                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">{room.name}</h2>
                  <p className="text-gray-600 leading-relaxed mb-6">{room.description}</p>

                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center text-gray-500">
                      <Users className="w-5 h-5 mr-2" />
                      <span>Max {room.max_guests} Guests</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {room.amenities?.map((amenity, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Starting from</span>
                      <p className="text-emerald-600 font-bold text-2xl">
                        Rp {room.base_price?.toLocaleString('id-ID')}
                        <span className="text-gray-400 text-sm font-normal">/night</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handlePlayVideo(room)}
                        variant="outline"
                        className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                        data-testid={`room-tour-btn-${room.room_type_id}`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Room Tour
                      </Button>
                      <Button
                        onClick={() => window.location.href = '/?book=' + room.room_type_id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                        data-testid={`book-now-btn-${room.room_type_id}`}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
    </div>
  );
};

export default Rooms;
