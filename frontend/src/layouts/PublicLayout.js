import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MapPin, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const PublicLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [footerContent, setFooterContent] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

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
    fetchFooterContent();
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const fetchFooterContent = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/global`);
      const footer = response.data.find(c => c.section === 'footer');
      if (footer) setFooterContent(footer.content);
    } catch (error) {
      console.error('Error fetching footer:', error);
    }
  };

  const handleCheckReservationClick = () => {
    if (user && isAdmin()) {
      navigate('/admin');
    } else {
      navigate('/check-reservation');
    }
    setIsMenuOpen(false);
  };

  // Check if current page is gallery (fullscreen)
  const isGalleryPage = location.pathname === '/gallery';

  if (isGalleryPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/30 overflow-x-hidden relative">
      {/* Header - Always dark emerald */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0" data-testid="logo-link">
              <span className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-white">
                Spencer Green
              </span>
            </Link>

            {/* Hamburger Menu Button - Always visible */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-emerald-800 transition-colors"
              data-testid="menu-toggle"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu - For all screen sizes */}
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
                      {item.name === 'Cek Reservasi' ? (
                        <button
                          onClick={handleCheckReservationClick}
                          data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                          className={`block w-full text-left px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                            location.pathname === item.path
                              ? 'bg-emerald-600 text-white'
                              : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'
                          }`}
                        >
                          {item.name}
                        </button>
                      ) : (
                        <Link
                          to={item.path}
                          data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                          className={`block px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                            location.pathname === item.path
                              ? 'bg-emerald-600 text-white'
                              : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'
                          }`}
                        >
                          {item.name}
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Contact info in menu */}
                <div className="mt-8 pt-8 border-t border-emerald-800">
                  <p className="text-emerald-400 text-sm mb-4">Contact Us</p>
                  <div className="space-y-3 text-emerald-200 text-sm">
                    <p>{footerContent?.phone || '+6281130700206'}</p>
                    <p>{footerContent?.email || 'reservasi@spencergreenhotel.com'}</p>
                  </div>
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-16 sm:pt-18 lg:pt-20">
        <Outlet />
      </main>

      {/* Google Maps Section */}
      <section className="bg-emerald-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-6">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">Find Us</h3>
            <p className="text-emerald-200 text-sm sm:text-base">{footerContent?.address || 'Jl. Raya Punten No.86, Punten, Kec. Bumiaji, Kota Batu, Jawa Timur 65338 Indonesia'}</p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-xl">
            <iframe
              src={`https://maps.google.com/maps?q=${footerContent?.map?.lat || -7.8332533},${footerContent?.map?.lng || 112.5288334}&hl=id&z=15&output=embed`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Spencer Green Hotel Location"
              className="w-full h-[250px] sm:h-[300px] lg:h-[350px]"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 text-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Logo & Description */}
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-4">Spencer Green Hotel</h3>
              <p className="text-emerald-200 leading-relaxed text-sm sm:text-base">
                Experience luxury and comfort in the heart of Batu city. 
                Your perfect getaway destination.
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-display text-base sm:text-lg font-semibold text-white mb-4">Contact Us</h4>
              <div className="space-y-3 text-emerald-200 text-sm sm:text-base">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{footerContent?.address || 'Jl. Raya Punten No.86, Punten, Kec. Bumiaji, Kota Batu, Jawa Timur 65338 Indonesia'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0" />
                  <p>{footerContent?.phone || '(0341) 597828'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0" />
                  <p>{footerContent?.email || 'reservasi@spencergreenhotel.com'}</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-display text-base sm:text-lg font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex flex-wrap gap-3">
                <a
                  href={footerContent?.tiktok || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-800 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                  data-testid="social-tiktok"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                <a
                  href={footerContent?.instagram || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-800 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                  data-testid="social-instagram"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href={footerContent?.facebook || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-800 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                  data-testid="social-facebook"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href={`https://wa.me/${footerContent?.whatsapp || '6281130700206'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-800 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                  data-testid="social-whatsapp"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-emerald-800 text-center text-emerald-300 text-sm">
            <p>&copy; {new Date().getFullYear()} Spencer Green Hotel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
