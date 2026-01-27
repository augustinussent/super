import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Waves, Dumbbell, Utensils, Sparkles, TreePine, Car } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Facilities = () => {
  const [heroContent, setHeroContent] = useState(null);
  const [content, setContent] = useState({});

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/facilities`);
        const hero = response.data.find(c => c.section === 'hero');
        if (hero) setHeroContent(hero.content);

        // Map other sections
        const contentMap = {};
        response.data.forEach(item => {
          contentMap[item.section] = item.content;
        });
        setContent(contentMap);
      } catch (error) {
        console.error('Error fetching content:', error);
      }
    };
    fetchContent();
  }, []);

  const defaultFacilities = [
    {
      key: 'pool',
      icon: Waves,
      defaultName: 'Infinity Pool',
      defaultDescription: 'Relax in our stunning infinity pool with panoramic mountain views. Open daily from 6 AM to 9 PM.',
      defaultImage: 'https://images.unsplash.com/photo-1558239041-c5fc98b811a7?w=800'
    },
    {
      key: 'spa',
      icon: Sparkles,
      defaultName: 'Spa & Wellness',
      defaultDescription: 'Rejuvenate your body and mind with our traditional Javanese treatments and modern therapies.',
      defaultImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'
    },
    {
      key: 'fitness',
      icon: Dumbbell,
      defaultName: 'Fitness Center',
      defaultDescription: 'State-of-the-art equipment and personal training available. Open 24 hours for hotel guests.',
      defaultImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'
    },
    {
      key: 'restaurant',
      icon: Utensils,
      defaultName: 'Restaurant & Bar',
      defaultDescription: 'Experience culinary excellence with our international cuisine and signature cocktails.',
      defaultImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
    },
    {
      key: 'garden',
      icon: TreePine,
      defaultName: 'Garden & Terrace',
      defaultDescription: 'Beautiful landscaped gardens perfect for morning walks or evening relaxation.',
      defaultImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800'
    },
    {
      key: 'parking',
      icon: Car,
      defaultName: 'Parking & Transport',
      defaultDescription: 'Complimentary parking and airport shuttle services available upon request.',
      defaultImage: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'
    }
  ];

  const infoContent = content['info'] || {};

  return (
    <div className="bg-emerald-50/30">
      {/* Hero */}
      <section className="relative h-[100svh] min-h-[600px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroContent?.image || 'https://images.unsplash.com/photo-1558239041-c5fc98b811a7?w=1920'})` }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {defaultFacilities.map((facility, index) => {
              const Icon = facility.icon;
              const itemContent = content[facility.key] || {};
              const name = itemContent.name || facility.defaultName;
              const description = itemContent.description || facility.defaultDescription;
              const image = itemContent.image || facility.defaultImage;

              return (
                <motion.div
                  key={facility.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white rounded-xl overflow-hidden shadow-soft card-hover"
                  data-testid={`facility-${index}`}
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={image}
                      alt={name}
                      className="w-full h-full object-cover img-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center text-white">
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center mr-3">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-xl font-medium">{name}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 leading-relaxed">{description}</p>
                    {itemContent.hours && (
                      <p className="text-emerald-600 text-sm mt-3 font-medium flex items-center">
                        Open: {itemContent.hours}
                      </p>
                    )}
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
