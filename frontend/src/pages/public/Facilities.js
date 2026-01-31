import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Waves, Dumbbell, Utensils, Sparkles, TreePine, Car } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [heroContent, setHeroContent] = useState(null);
  const [infoContent, setInfoContent] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Facilities Page Content (Hero & Info)
        const contentResponse = await axios.get(`${API_URL}/content/facilities`);
        const hero = contentResponse.data.find(c => c.section === 'hero');
        const info = contentResponse.data.find(c => c.section === 'info');
        if (hero) setHeroContent(hero.content);
        if (info) setInfoContent(info.content);

        // Fetch Dynamic Facilities List
        const facilitiesResponse = await axios.get(`${API_URL}/facilities`);
        setFacilities(facilitiesResponse.data);
      } catch (error) {
        console.error('Error fetching facilities data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-emerald-50/30">
      {/* Hero */}
      <section className="relative h-[100svh] min-h-[600px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroContent?.image || 'https://res.cloudinary.com/dgfjos8xa/image/upload/v1767362983/spencer-green-hotel-batu-malang-main-pool_udaykk.jpg'})` }}
        >
          <div className="absolute inset-0 bg-black/25" />
        </div>
        <div className="relative text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="hero-subtitle text-emerald-300 uppercase tracking-widest text-sm mb-2">{heroContent?.subtitle || 'Amenities'}</p>
            {/* SEO H1 - Hidden but indexable */}
            <h1 className="sr-only">{heroContent?.title || 'Fasilitas Lengkap di Spencer Green Hotel Batu'}</h1>
            {/* Visual Title */}
            <p className="font-display hero-title text-5xl text-white" role="heading" aria-level="2">{heroContent?.title || 'Hotel Facilities'}</p>
          </motion.div>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {facilities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Loading facilities...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {facilities.map((facility, index) => {
                // Use default icon or generic one since we don't store icon name in DB yet
                // Or we could map based on name keywords if we really want specific icons, 
                // but for now a generic star or dot is safer, or just no icon.
                // The original design had specific icons. 
                // Let's use a generic Sparkles icon for all for now, or maybe map simple keywords.
                const Icon = Sparkles;

                return (
                  <motion.div
                    key={facility.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-white rounded-xl overflow-hidden shadow-soft card-hover"
                    data-testid={`facility-${index}`}
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img
                        src={facility.image || 'https://images.unsplash.com/photo-1558239041-c5fc98b811a7?w=800'}
                        alt={facility.name}
                        className="w-full h-full object-cover img-zoom"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 flex items-center text-white">
                        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center mr-3">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-display text-xl font-medium">{facility.name}</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 leading-relaxed">{facility.description}</p>
                      {facility.hours && (
                        <p className="text-emerald-600 text-sm mt-3 font-medium flex items-center">
                          Open: {facility.hours}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-medium text-gray-900 mb-4">
            {infoContent.title || 'Experience Complete Comfort'}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {infoContent.description || 'All facilities are available exclusively for our hotel guests. For special arrangements or inquiries, please contact our concierge team.'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Facilities;
