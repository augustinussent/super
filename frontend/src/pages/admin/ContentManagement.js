import { useState, useEffect } from 'react';
import { Save, Image, Upload, Trash2, Play } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import MediaUpload from '../../components/MediaUpload';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ContentManagement = () => {
  const [content, setContent] = useState({});
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [currentUploadTarget, setCurrentUploadTarget] = useState(null);

  useEffect(() => {
    fetchContent();
    fetchRooms();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API_URL}/content`);
      const contentMap = {};
      response.data.forEach(item => {
        const key = `${item.page}_${item.section}`;
        contentMap[key] = item;
      });
      setContent(contentMap);
    } catch (error) {
      toast.error('Error fetching content');
    } finally {
      setIsLoading(false);
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

  const getToken = () => localStorage.getItem('token');

  const saveContent = async (page, section, contentType, contentData) => {
    setIsSaving(true);
    try {
      await axios.post(`${API_URL}/admin/content`, {
        page,
        section,
        content_type: contentType,
        content: contentData
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Content saved');
      fetchContent();
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (key, field, value) => {
    setContent(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        content: {
          ...prev[key]?.content,
          [field]: value
        }
      }
    }));
  };

  const handleImageUploadSuccess = (mediaData) => {
    if (currentUploadTarget) {
      updateField(currentUploadTarget.key, currentUploadTarget.field, mediaData.secure_url);
      setShowImageUpload(false);
      setCurrentUploadTarget(null);
      toast.success('Image uploaded successfully');
    }
  };

  const openImageUpload = (key, field) => {
    setCurrentUploadTarget({ key, field });
    setShowImageUpload(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div data-testid="content-management">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Kelola Konten</h1>
        <p className="text-gray-500">Ubah teks, foto, dan link di setiap halaman</p>
      </div>

      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="bg-white shadow-soft">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* Home Content */}
        <TabsContent value="home" className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-emerald-600" />
              Hero Section
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input
                  value={content['home_hero']?.content?.title || ''}
                  onChange={(e) => updateField('home_hero', 'title', e.target.value)}
                  placeholder="Spencer Green Hotel"
                  data-testid="hero-title-input"
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={content['home_hero']?.content?.subtitle || ''}
                  onChange={(e) => updateField('home_hero', 'subtitle', e.target.value)}
                  placeholder="Experience Luxury in the Heart of Batu"
                  data-testid="hero-subtitle-input"
                />
              </div>
              <div>
                <Label>Gambar Hero</Label>
                <div className="flex gap-2">
                  <Input
                    value={content['home_hero']?.content?.image || ''}
                    onChange={(e) => updateField('home_hero', 'image', e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                    data-testid="hero-image-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openImageUpload('home_hero', 'image')}
                    data-testid="hero-upload-btn"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                {content['home_hero']?.content?.image && (
                  <img 
                    src={content['home_hero']?.content?.image} 
                    alt="Hero preview" 
                    className="mt-2 rounded-lg h-32 object-cover"
                  />
                )}
              </div>
              <Button
                onClick={() => saveContent('home', 'hero', 'hero', content['home_hero']?.content || {})}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="save-hero-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Hero
              </Button>
            </div>
          </div>

          {/* Promo Banner */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">Promo Banner</h3>
            <div className="space-y-4">
              <div>
                <Label>Judul Promo</Label>
                <Input
                  value={content['home_promo_banner']?.content?.title || ''}
                  onChange={(e) => updateField('home_promo_banner', 'title', e.target.value)}
                  placeholder="Special Weekend Offer"
                  data-testid="promo-title-input"
                />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea
                  value={content['home_promo_banner']?.content?.description || ''}
                  onChange={(e) => updateField('home_promo_banner', 'description', e.target.value)}
                  placeholder="Get 20% off for weekend stays..."
                  data-testid="promo-description-input"
                />
              </div>
              <div>
                <Label>Gambar Promo</Label>
                <div className="flex gap-2">
                  <Input
                    value={content['home_promo_banner']?.content?.image || ''}
                    onChange={(e) => updateField('home_promo_banner', 'image', e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                    data-testid="promo-image-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openImageUpload('home_promo_banner', 'image')}
                    data-testid="promo-upload-btn"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="promo-active"
                  checked={content['home_promo_banner']?.content?.is_active || false}
                  onChange={(e) => updateField('home_promo_banner', 'is_active', e.target.checked)}
                  className="rounded border-gray-300"
                  data-testid="promo-active-checkbox"
                />
                <Label htmlFor="promo-active">Tampilkan Banner Promo</Label>
              </div>
              <Button
                onClick={() => saveContent('home', 'promo_banner', 'banner', content['home_promo_banner']?.content || {})}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="save-promo-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Promo
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Rooms Content */}
        <TabsContent value="rooms" className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">
              Room Images & Videos
            </h3>
            <p className="text-gray-500 mb-6">
              Upload gambar dan video tour untuk setiap tipe kamar
            </p>

            {rooms.map((room) => (
              <div key={room.room_type_id} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{room.name}</h4>
                    <p className="text-sm text-gray-500">
                      {room.images?.length || 0} gambar • {room.video_url ? '1 video' : 'No video'}
                    </p>
                  </div>
                  <span className="text-emerald-600 font-medium">
                    Rp {room.base_price?.toLocaleString()}
                  </span>
                </div>

                {/* Current Images */}
                {room.images && room.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {room.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={img} 
                          alt={`${room.name} ${idx + 1}`}
                          className="w-24 h-16 object-cover rounded"
                        />
                        <button
                          onClick={async () => {
                            try {
                              await axios.delete(`${API_URL}/media/delete-room-image`, {
                                params: { room_type_id: room.room_type_id, image_url: img },
                                headers: { Authorization: `Bearer ${getToken()}` }
                              });
                              toast.success('Image deleted');
                              fetchRooms();
                            } catch (error) {
                              toast.error('Failed to delete image');
                            }
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Video Preview */}
                {room.video_url && (
                  <div className="mb-4">
                    <Label className="text-sm">Video Tour</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <video 
                        src={room.video_url} 
                        className="w-48 h-28 object-cover rounded"
                        controls
                      />
                      <button
                        onClick={async () => {
                          try {
                            await axios.delete(`${API_URL}/media/delete-room-video`, {
                              params: { room_type_id: room.room_type_id },
                              headers: { Authorization: `Bearer ${getToken()}` }
                            });
                            toast.success('Video deleted');
                            fetchRooms();
                          } catch (error) {
                            toast.error('Failed to delete video');
                          }
                        }}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Buttons */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid={`upload-room-image-${room.room_type_id}`}>
                        <Image className="w-4 h-4 mr-2" />
                        Upload Gambar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Upload Gambar - {room.name}</DialogTitle>
                      </DialogHeader>
                      <MediaUpload
                        uploadEndpoint={`/media/upload/room-image?room_type_id=${room.room_type_id}`}
                        acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                        maxFileSize={10 * 1024 * 1024}
                        title="Upload Room Image"
                        description="Max 10MB, JPEG/PNG/WebP"
                        onUploadSuccess={() => {
                          fetchRooms();
                        }}
                      />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid={`upload-room-video-${room.room_type_id}`}>
                        <Play className="w-4 h-4 mr-2" />
                        Upload Video Tour
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Upload Video Tour - {room.name}</DialogTitle>
                      </DialogHeader>
                      <MediaUpload
                        uploadEndpoint={`/media/upload/room-video?room_type_id=${room.room_type_id}`}
                        acceptedTypes={['video/mp4', 'video/quicktime']}
                        maxFileSize={500 * 1024 * 1024}
                        title="Upload Room Tour Video"
                        description="Max 500MB, MP4/MOV"
                        onUploadSuccess={() => {
                          fetchRooms();
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Gallery Content */}
        <TabsContent value="gallery" className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-gray-900">Gallery Images</h3>
                <p className="text-gray-500 text-sm">Kelola gambar di halaman Gallery</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="upload-gallery-btn">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload ke Gallery
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Upload Gallery Image</DialogTitle>
                  </DialogHeader>
                  <MediaUpload
                    uploadEndpoint="/media/upload/gallery?category=general"
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    maxFileSize={10 * 1024 * 1024}
                    isMultiple={true}
                    maxFiles={5}
                    title="Upload Gallery Images"
                    description="Max 10MB per file, up to 5 files"
                    onUploadSuccess={(mediaData) => {
                      toast.success('Gallery images uploaded');
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-4">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const key = `gallery_gallery_item_${index}`;
                return (
                  <div key={index} className="flex gap-4 items-center p-3 bg-gray-50 rounded-lg">
                    {content[key]?.content?.url && (
                      <img 
                        src={content[key]?.content?.url} 
                        alt={`Gallery ${index + 1}`}
                        className="w-20 h-14 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Image {index + 1} URL</Label>
                      <Input
                        value={content[key]?.content?.url || ''}
                        onChange={(e) => updateField(key, 'url', e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        data-testid={`gallery-image-${index}-input`}
                        className="mb-2"
                      />
                      <Input
                        value={content[key]?.content?.caption || ''}
                        onChange={(e) => updateField(key, 'caption', e.target.value)}
                        placeholder="Caption"
                        data-testid={`gallery-caption-${index}-input`}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => saveContent('gallery', `gallery_item_${index}`, 'image', {
                        ...content[key]?.content,
                        order: index
                      })}
                      disabled={isSaving}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Footer Content */}
        <TabsContent value="footer" className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">Informasi Footer</h3>
            <div className="space-y-4">
              <div>
                <Label>Alamat</Label>
                <Textarea
                  value={content['global_footer']?.content?.address || ''}
                  onChange={(e) => updateField('global_footer', 'address', e.target.value)}
                  placeholder="Jl. Raya Selecta No. 1, Batu, East Java"
                  data-testid="footer-address-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telepon</Label>
                  <Input
                    value={content['global_footer']?.content?.phone || ''}
                    onChange={(e) => updateField('global_footer', 'phone', e.target.value)}
                    placeholder="+62 813 3448 0210"
                    data-testid="footer-phone-input"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={content['global_footer']?.content?.email || ''}
                    onChange={(e) => updateField('global_footer', 'email', e.target.value)}
                    placeholder="info@spencergreen.com"
                    data-testid="footer-email-input"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Social Media Links</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>TikTok URL</Label>
                    <Input
                      value={content['global_footer']?.content?.tiktok || ''}
                      onChange={(e) => updateField('global_footer', 'tiktok', e.target.value)}
                      placeholder="https://tiktok.com/@spencergreenhotel"
                      data-testid="footer-tiktok-input"
                    />
                  </div>
                  <div>
                    <Label>Instagram URL</Label>
                    <Input
                      value={content['global_footer']?.content?.instagram || ''}
                      onChange={(e) => updateField('global_footer', 'instagram', e.target.value)}
                      placeholder="https://instagram.com/spencergreenhotel"
                      data-testid="footer-instagram-input"
                    />
                  </div>
                  <div>
                    <Label>Facebook URL</Label>
                    <Input
                      value={content['global_footer']?.content?.facebook || ''}
                      onChange={(e) => updateField('global_footer', 'facebook', e.target.value)}
                      placeholder="https://facebook.com/spencergreenhotel"
                      data-testid="footer-facebook-input"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp Number</Label>
                    <Input
                      value={content['global_footer']?.content?.whatsapp || ''}
                      onChange={(e) => updateField('global_footer', 'whatsapp', e.target.value)}
                      placeholder="6281334480210"
                      data-testid="footer-whatsapp-input"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => saveContent('global', 'footer', 'info', content['global_footer']?.content || {})}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="save-footer-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Footer
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Upload Dialog */}
      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          <MediaUpload
            uploadEndpoint="/media/upload/content-image?section=general"
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            maxFileSize={10 * 1024 * 1024}
            title="Upload Content Image"
            description="Max 10MB, JPEG/PNG/WebP"
            onUploadSuccess={handleImageUploadSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
