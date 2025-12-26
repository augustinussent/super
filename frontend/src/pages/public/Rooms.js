import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, X, Users } from 'lucide-react';
import axios from 'axios';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handlePlayVideo = (url) => {
    setVideoUrl(url || 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    setShowVideoModal(true);
  };

  return (
    <div className="bg-emerald-50/30">
      {/* Hero */}
      <section className="relative h-[40vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1920)' }}
        >
          <div className="absolute inset-0 bg-emerald-950/60" />
        </div>
        <div className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-emerald-300 uppercase tracking-widest text-sm mb-2">Accommodations</p>
            <h1 className="font-display text-5xl font-bold text-white">Our Rooms</h1>
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
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
                data-testid={`room-detail-${room.room_type_id}`}
              >
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                    <img
                      src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                      alt={room.name}
                      className="w-full h-full object-cover img-zoom"
                    />
                    {room.video_url && (
                      <button
                        onClick={() => handlePlayVideo(room.video_url)}
                        data-testid={`room-video-btn-${room.room_type_id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-emerald-600 ml-1" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>

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

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 text-sm">Starting from</span>
                      <p className="text-emerald-600 font-bold text-2xl">
                        Rp {room.base_price.toLocaleString('id-ID')}
                        <span className="text-gray-400 text-sm font-normal">/night</span>
                      </p>
                    </div>
                    <Button
                      onClick={() => window.location.href = '/?book=' + room.room_type_id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                      data-testid={`book-now-btn-${room.room_type_id}`}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl p-0">
          <button
            onClick={() => setShowVideoModal(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
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

export default Rooms;
