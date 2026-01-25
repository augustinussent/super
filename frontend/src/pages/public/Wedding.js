import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Camera, Utensils, Music, Flower2, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Wedding = () => {
  const [heroContent, setHeroContent] = useState(null);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/wedding`);
        const hero = response.data.find(c => c.section === 'hero');
        if (hero) setHeroContent(hero.content);
      } catch (error) {
        console.error('Error fetching hero content:', error);
      }
    };
    fetchHeroContent();
  }, []);

  const venues = [
    {
      name: 'Grand Ballroom',
      capacity: '300 - 500 guests',
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
      description: 'Our magnificent ballroom with crystal chandeliers and elegant decor'
    },
    {
      name: 'Garden Pavilion',
      capacity: '100 - 200 guests',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
      description: 'An enchanting outdoor setting surrounded by lush tropical gardens'
    },
    {
      name: 'Poolside Terrace',
      capacity: '50 - 100 guests',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
      description: 'Intimate celebration with stunning mountain backdrop'
    }
  ];

  const services = [
    { icon: Flower2, name: 'Floral Design', desc: 'Custom floral arrangements' },
    { icon: Utensils, name: 'Catering', desc: 'Exquisite culinary experiences' },
    { icon: Camera, name: 'Photography', desc: 'Professional photo & video' },
    { icon: Music, name: 'Entertainment', desc: 'Live music & DJ services' }
  ];

  return (
    <div className="bg-emerald-50/30 pt-16 sm:pt-18 lg:pt-20">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroContent?.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920'})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="relative text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Heart className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            {/* SEO H1 - Hidden but indexable */}
            <h1 className="sr-only">Paket Wedding & Venue Pernikahan Spencer Green Hotel Batu</h1>
            {/* Visual Title */}
            <p className="font-display text-5xl md:text-6xl font-bold text-white mb-4" role="heading" aria-level="2">Your Dream Wedding</p>
            <p className="text-white/90 max-w-2xl mx-auto text-lg">
              {heroContent?.subtitle || 'Create unforgettable memories at Spencer Green Hotel with breathtaking views and exceptional service'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Venues */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">Venues</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">Wedding Venues</h2>
          </div>

          <div className="space-y-16">
            {venues.map((venue, index) => (
              <motion.div
                key={venue.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}
                data-testid={`wedding-venue-${index}`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-luxury">
                    <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <h3 className="font-display text-3xl font-bold text-gray-900 mb-4">{venue.name}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{venue.description}</p>
                  <div className="flex items-center text-emerald-600 mb-6">
                    <Users className="w-5 h-5 mr-2" />
                    <span className="font-medium">{venue.capacity}</span>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                    Schedule Visit
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">What We Offer</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">Wedding Services</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                  data-testid={`wedding-service-${index}`}
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-soft flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-gray-500 text-sm">{service.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="hearts" patternUnits="userSpaceOnUse" width="20" height="20">
              <path d="M10 6 C7 3, 3 6, 6 10 L10 14 L14 10 C17 6, 13 3, 10 6" fill="white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#hearts)" />
          </svg>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Begin Your Forever</h2>
          <p className="text-emerald-200 mb-8 text-lg">
            Let us help you plan the wedding of your dreams
          </p>
          <a
            href="https://wa.me/6281130700206?text=Hi,%20I%20want%20to%20inquire%20about%20wedding%20packages"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-white text-emerald-800 px-8 py-4 rounded-full font-semibold hover:bg-emerald-50 transition-colors"
            data-testid="wedding-contact-btn"
          >
            <Phone className="w-5 h-5 mr-2" />
            Contact Wedding Specialist
          </a>
        </div>
      </section>
    </div>
  );
};

export default Wedding;
