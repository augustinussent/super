import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Waves, Dumbbell, Utensils, Sparkles, TreePine, Car } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Facilities = () => {
  const [heroContent, setHeroContent] = useState(null);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/facilities`);
        const hero = response.data.find(c => c.section === 'hero');
        if (hero) setHeroContent(hero.content);
      } catch (error) {
        console.error('Error fetching hero content:', error);
      }
    };
    fetchHeroContent();
  }, []);

  const facilities = [
    {
      icon: Waves,
      name: 'Infinity Pool',
      description: 'Relax in our stunning infinity pool with panoramic mountain views. Open daily from 6 AM to 9 PM.',
      image: 'https://images.unsplash.com/photo-1558239041-c5fc98b811a7?w=800'
    },
    {
      icon: Sparkles,
      name: 'Spa & Wellness',
      description: 'Rejuvenate your body and mind with our traditional Javanese treatments and modern therapies.',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'
    },
    {
      icon: Dumbbell,
      name: 'Fitness Center',
      description: 'State-of-the-art equipment and personal training available. Open 24 hours for hotel guests.',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'
    },
    {
      icon: Utensils,
      name: 'Restaurant & Bar',
      description: 'Experience culinary excellence with our international cuisine and signature cocktails.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
    },
    {
      icon: TreePine,
      name: 'Garden & Terrace',
      description: 'Beautiful landscaped gardens perfect for morning walks or evening relaxation.',
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800'
    },
    {
      icon: Car,
      name: 'Parking & Transport',
      description: 'Complimentary parking and airport shuttle services available upon request.',
      image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'
    }
  ];

  return (
    <div className="bg-emerald-50/30">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroContent?.image || 'https://images.unsplash.com/photo-1558239041-c5fc98b811a7?w=1920'})` }}
        >
          <div className="absolute inset-0 bg-emerald-950/60" />
        </div>
        <div className="relative text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-emerald-300 uppercase tracking-widest text-sm mb-2">Amenities</p>
            {/* SEO H1 - Hidden but indexable */}
            <h1 className="sr-only">Fasilitas Lengkap di Spencer Green Hotel Batu</h1>
            {/* Visual Title */}
            <p className="font-display hero-title text-5xl text-white" role="heading" aria-level="2">Hotel Facilities</p>
          </motion.div>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((facility, index) => {
              const Icon = facility.icon;
              return (
                <motion.div
                  key={facility.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white rounded-xl overflow-hidden shadow-soft card-hover"
                  data-testid={`facility-${index}`}
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={facility.image}
                      alt={facility.name}
                      className="w-full h-full object-cover img-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center text-white">
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center mr-3">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-xl font-semibold">{facility.name}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 leading-relaxed">{facility.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
            Experience Complete Comfort
          </h2>
          <p className="text-gray-600 leading-relaxed">
            All facilities are available exclusively for our hotel guests.
            For special arrangements or inquiries, please contact our concierge team.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Facilities;
