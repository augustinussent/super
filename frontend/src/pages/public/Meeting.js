import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi, Projector, Coffee, Clock, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Meeting = () => {
  const [heroContent, setHeroContent] = useState(null);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/meeting`);
        const hero = response.data.find(c => c.section === 'hero');
        if (hero) setHeroContent(hero.content);
      } catch (error) {
        console.error('Error fetching hero content:', error);
      }
    };
    fetchHeroContent();
  }, []);

  const meetingRooms = [
    {
      name: 'Boardroom',
      capacity: '10 - 20 pax',
      image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800',
      features: ['4K Display', 'Video Conference', 'Whiteboard', 'Sound System']
    },
    {
      name: 'Conference Hall',
      capacity: '50 - 100 pax',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
      features: ['Stage', 'Projector', 'Microphones', 'Recording']
    },
    {
      name: 'Training Room',
      capacity: '20 - 40 pax',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      features: ['Classroom Setup', 'Breakout Areas', 'Flip Charts', 'WiFi']
    }
  ];

  const packages = [
    { name: 'Half Day', duration: '4 Hours', price: 'Rp 500.000/pax', includes: ['1x Coffee Break', 'Meeting Room', 'WiFi'] },
    { name: 'Full Day', duration: '8 Hours', price: 'Rp 850.000/pax', includes: ['2x Coffee Break', '1x Lunch', 'Meeting Room', 'WiFi'] },
    { name: 'Residential', duration: '2D1N', price: 'Rp 1.500.000/pax', includes: ['Accommodation', 'All Meals', 'Meeting Room', 'Team Building'] }
  ];

  return (
    <div className="bg-emerald-50/30">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroContent?.image || 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1920'})` }}
        >
          <div className="absolute inset-0 bg-emerald-950/70" />
        </div>
        <div className="relative text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-emerald-300 uppercase tracking-widest text-sm mb-2">Corporate Events</p>
            {/* SEO H1 - Hidden but indexable */}
            <h1 className="sr-only">Meeting Room & Event Space Spencer Green Hotel Batu</h1>
            {/* Visual Title */}
            <p className="font-display text-5xl text-white mb-4" role="heading" aria-level="2">Meeting & Events</p>
            <p className="text-emerald-100 max-w-2xl mx-auto">
              Host your next corporate event in our state-of-the-art meeting facilities with stunning mountain views
            </p>
          </motion.div>
        </div>
      </section>

      {/* Meeting Rooms */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">Venues</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">Meeting Rooms</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {meetingRooms.map((room, index) => (
              <motion.div
                key={room.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-soft card-hover"
                data-testid={`meeting-room-${index}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover img-zoom" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">{room.name}</h3>
                  <div className="flex items-center text-gray-500 mb-4">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{room.capacity}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {room.features.map((feature, i) => (
                      <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">Packages</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">Meeting Packages</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-soft text-center"
                data-testid={`meeting-package-${index}`}
              >
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <p className="text-gray-500 mb-4">{pkg.duration}</p>
                <p className="text-emerald-600 font-bold text-2xl mb-6">{pkg.price}</p>
                <ul className="space-y-3 mb-8">
                  {pkg.includes.map((item, i) => (
                    <li key={i} className="text-gray-600 flex items-center justify-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Request Quote
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-emerald-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Plan Your Next Event</h2>
          <p className="text-emerald-200 mb-8">
            Our dedicated events team is ready to help you create a memorable experience
          </p>
          <a
            href="https://wa.me/6281130700206?text=Hi,%20I%20want%20to%20inquire%20about%20meeting%20packages"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-white text-emerald-800 px-8 py-4 rounded-full font-semibold hover:bg-emerald-50 transition-colors"
            data-testid="meeting-contact-btn"
          >
            <Phone className="w-5 h-5 mr-2" />
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
};

export default Meeting;
