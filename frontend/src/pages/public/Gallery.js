import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Kamar', path: '/rooms' },
    { name: 'Meeting', path: '/meeting' },
    { name: 'Wedding', path: '/wedding' },
    { name: 'Fasilitas', path: '/facilities' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Cek Reservasi', path: '/check-reservation' },
  ];

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/gallery`);
      const items = response.data
        .filter(c => c.content_type === 'image')
        .sort((a, b) => (a.content.order || 0) - (b.content.order || 0));

      if (items.length === 0) {
        // Default gallery images
        setGalleryItems([
          { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080', caption: 'Hotel Exterior' },
          { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1080', caption: 'Executive Suite' },
          { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1080', caption: 'Deluxe Room' },
          { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1080', caption: 'Superior Room' },
          { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1080', caption: 'Pool View' },
          { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1080', caption: 'Restaurant' }
        ]);
      } else {
        setGalleryItems(items.map(i => i.content));
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
      // Fallback images
      setGalleryItems([
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080', caption: 'Hotel Exterior' },
        { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1080', caption: 'Executive Suite' },
        { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1080', caption: 'Deluxe Room' },
        { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1080', caption: 'Superior Room' },
        { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1080', caption: 'Pool View' },
        { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1080', caption: 'Restaurant' }
      ]);
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isMenuOpen) return; // Don't navigate when menu is open
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        goToPrev();
      }
    };

    const handleWheel = (e) => {
      if (isMenuOpen) return; // Don't navigate when menu is open
      if (e.deltaY > 0) {
        goToNext();
      } else if (e.deltaY < 0) {
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Debounce wheel event
    let wheelTimeout;
    const debouncedWheel = (e) => {
      if (wheelTimeout) return;
      handleWheel(e);
      wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
      }, 500);
    };

    window.addEventListener('wheel', debouncedWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', debouncedWheel);
    };
  }, [galleryItems.length, isMenuOpen]);

  if (galleryItems.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden" data-testid="gallery-container">
      {/* SEO H1 - Screen Reader Accessible */}
      <h1 className="sr-only">Galeri Foto Spencer Green Hotel Batu | Kamar, Kolam & Rooftop</h1>

      {/* Current Image */}
      <div className="relative h-full">
        {galleryItems.map((item, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{
              opacity: index === currentIndex ? 1 : 0,
              scale: index === currentIndex ? 1 : 1.1
            }}
            transition={{ duration: 0.5 }}
            className={`absolute inset-0 ${index === currentIndex ? 'z-10' : 'z-0'}`}
          >
            <img
              src={item.url}
              alt={item.caption || `Gallery ${index + 1}`}
              className="w-full h-full object-cover"
              data-testid={`gallery-image-${index}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </motion.div>
        ))}

        {/* Caption */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-20 left-0 right-0 text-center z-20"
        >
          <p className="text-white/60 uppercase tracking-widest text-sm mb-2">
            {currentIndex + 1} / {galleryItems.length}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
            {galleryItems[currentIndex]?.caption || 'Spencer Green Hotel'}
          </h2>
        </motion.div>

        {/* Navigation */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-4">
          <button
            onClick={goToPrev}
            className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            data-testid="gallery-prev-btn"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            data-testid="gallery-next-btn"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-2">
          {galleryItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                ? 'bg-emerald-500 h-8'
                : 'bg-white/40 hover:bg-white/60'
                }`}
              data-testid={`gallery-dot-${index}`}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <p className="text-white/40 text-sm">
            Scroll or use arrow keys to navigate
          </p>
        </div>

        {/* Header with Logo and Hamburger Menu */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-between">
          <Link
            to="/"
            className="text-white/80 hover:text-white flex items-center space-x-2"
            data-testid="gallery-back-btn"
          >
            <span className="font-display text-xl font-bold">Spencer Green</span>
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            data-testid="gallery-menu-toggle"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Slide-out Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
              <motion.nav
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-emerald-950 shadow-luxury overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-8">
                    <span className="font-display text-xl font-bold text-white">Menu</span>
                    <button onClick={() => setIsMenuOpen(false)} className="p-2 text-emerald-200 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {menuItems.map((item, index) => (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.path}
                          data-testid={`gallery-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                          className={`block px-4 py-3 rounded-lg text-lg font-medium transition-colors ${location.pathname === item.path
                            ? 'bg-emerald-600 text-white'
                            : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'
                            }`}
                        >
                          {item.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Gallery;

