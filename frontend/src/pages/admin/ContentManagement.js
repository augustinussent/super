import { useState, useEffect } from 'react';
import { Save, Image, Upload, Trash2, Plus, GripVertical } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import MediaUpload from '../../components/MediaUpload';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Section Component for reusability
const ContentSection = ({ title, children }) => (
  <div className="bg-white rounded-xl p-6 shadow-soft">
    <h3 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Image className="w-5 h-5 text-emerald-600" />
      {title}
    </h3>
    {children}
  </div>
);

const ImageField = ({ label, value, onChange, onUpload }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex gap-2">
      <Input value={value} onChange={onChange} placeholder="https://..." className="flex-1" />
      <Button type="button" variant="outline" onClick={onUpload}>
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </Button>
    </div>
    {value && <img src={value} alt="Preview" className="mt-2 rounded-lg h-24 object-cover" />}
  </div>
);

const ContentManagement = () => {
  const [content, setContent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchContent();
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
      toast.success('Konten berhasil disimpan');
      fetchContent();
    } catch (error) {
      toast.error('Gagal menyimpan konten');
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

  const getContent = (page, section, field, defaultValue = '') => {
    const key = `${page}_${section}`;
    return content[key]?.content?.[field] ?? defaultValue;
  };

  const openMediaUpload = (key, field, mediaType = 'image') => {
    setUploadTarget({ key, field, mediaType });
    setShowMediaUpload(true);
  };

  const handleMediaUpload = (mediaData) => {
    if (uploadTarget) {
      updateField(uploadTarget.key, uploadTarget.field, mediaData.secure_url);
      setShowMediaUpload(false);
      setUploadTarget(null);
      toast.success('Media berhasil diupload');
    }
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
        <p className="text-gray-500">Edit semua teks, foto, dan video di setiap halaman</p>
      </div>

      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="bg-white shadow-soft flex-wrap h-auto p-1">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="rooms">Rooms Page</TabsTrigger>
          <TabsTrigger value="meeting">Meeting</TabsTrigger>
          <TabsTrigger value="wedding">Wedding</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* ==================== HOME PAGE ==================== */}
        <TabsContent value="home" className="space-y-6">
          {/* Hero Section */}
          <ContentSection title="Hero Section">
            <div className="space-y-4">
              <div>
                <Label>Judul Utama</Label>
                <Input
                  value={getContent('home', 'hero', 'title')}
                  onChange={(e) => updateField('home_hero', 'title', e.target.value)}
                  placeholder="Spencer Green Hotel"
                  data-testid="home-hero-title"
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={getContent('home', 'hero', 'subtitle')}
                  onChange={(e) => updateField('home_hero', 'subtitle', e.target.value)}
                  placeholder="Experience Luxury..."
                  data-testid="home-hero-subtitle"
                />
              </div>
              <ImageField
                label="Gambar Hero"
                value={getContent('home', 'hero', 'image')}
                onChange={(e) => updateField('home_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('home_hero', 'image')}
              />
              <Button onClick={() => saveContent('home', 'hero', 'hero', content['home_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          {/* Promo Banner */}
          <ContentSection title="Promo Banner">
            <div className="space-y-4">
              <div>
                <Label>Judul Promo</Label>
                <Input value={getContent('home', 'promo_banner', 'title')} onChange={(e) => updateField('home_promo_banner', 'title', e.target.value)} placeholder="Special Offer" />
              </div>
              <div>
                <Label>Deskripsi Promo</Label>
                <Textarea value={getContent('home', 'promo_banner', 'description')} onChange={(e) => updateField('home_promo_banner', 'description', e.target.value)} rows={2} />
              </div>
              <ImageField
                label="Gambar Promo"
                value={getContent('home', 'promo_banner', 'image')}
                onChange={(e) => updateField('home_promo_banner', 'image', e.target.value)}
                onUpload={() => openMediaUpload('home_promo_banner', 'image')}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={getContent('home', 'promo_banner', 'is_active', false)}
                  onCheckedChange={(v) => updateField('home_promo_banner', 'is_active', v)}
                />
                <Label>Tampilkan Promo</Label>
              </div>
              <Button onClick={() => saveContent('home', 'promo_banner', 'banner', content['home_promo_banner']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Promo
              </Button>
            </div>
          </ContentSection>

          {/* About Section */}
          <ContentSection title="About Section">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('home', 'about', 'title')} onChange={(e) => updateField('home_about', 'title', e.target.value)} placeholder="About Our Hotel" />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea value={getContent('home', 'about', 'description')} onChange={(e) => updateField('home_about', 'description', e.target.value)} rows={4} />
              </div>
              <ImageField
                label="Gambar"
                value={getContent('home', 'about', 'image')}
                onChange={(e) => updateField('home_about', 'image', e.target.value)}
                onUpload={() => openMediaUpload('home_about', 'image')}
              />
              <Button onClick={() => saveContent('home', 'about', 'section', content['home_about']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan About
              </Button>
            </div>
          </ContentSection>
        </TabsContent>

        {/* ==================== ROOMS PAGE ==================== */}
        <TabsContent value="rooms" className="space-y-6">
          <ContentSection title="Rooms Page Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('rooms', 'hero', 'title')} onChange={(e) => updateField('rooms_hero', 'title', e.target.value)} placeholder="Our Rooms" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('rooms', 'hero', 'subtitle')} onChange={(e) => updateField('rooms_hero', 'subtitle', e.target.value)} placeholder="Accommodations" />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('rooms', 'hero', 'image')}
                onChange={(e) => updateField('rooms_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('rooms_hero', 'image')}
              />
              <Button onClick={() => saveContent('rooms', 'hero', 'hero', content['rooms_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan
              </Button>
            </div>
          </ContentSection>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Tips:</strong> Untuk edit detail kamar (nama, harga, foto, video), gunakan menu <strong>Kelola Kamar</strong> di sidebar.
            </p>
          </div>
        </TabsContent>

        {/* ==================== MEETING PAGE ==================== */}
        <TabsContent value="meeting" className="space-y-6">
          <ContentSection title="Meeting Page Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('meeting', 'hero', 'title')} onChange={(e) => updateField('meeting_hero', 'title', e.target.value)} placeholder="Meeting & Events" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('meeting', 'hero', 'subtitle')} onChange={(e) => updateField('meeting_hero', 'subtitle', e.target.value)} placeholder="Business Facilities" />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('meeting', 'hero', 'image')}
                onChange={(e) => updateField('meeting_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('meeting_hero', 'image')}
              />
              <Button onClick={() => saveContent('meeting', 'hero', 'hero', content['meeting_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          <ContentSection title="Meeting Room 1">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Ruangan</Label>
                  <Input value={getContent('meeting', 'room1', 'name')} onChange={(e) => updateField('meeting_room1', 'name', e.target.value)} placeholder="Grand Ballroom" />
                </div>
                <div>
                  <Label>Kapasitas</Label>
                  <Input value={getContent('meeting', 'room1', 'capacity')} onChange={(e) => updateField('meeting_room1', 'capacity', e.target.value)} placeholder="500 pax" />
                </div>
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea value={getContent('meeting', 'room1', 'description')} onChange={(e) => updateField('meeting_room1', 'description', e.target.value)} rows={3} />
              </div>
              <ImageField
                label="Gambar"
                value={getContent('meeting', 'room1', 'image')}
                onChange={(e) => updateField('meeting_room1', 'image', e.target.value)}
                onUpload={() => openMediaUpload('meeting_room1', 'image')}
              />
              <Button onClick={() => saveContent('meeting', 'room1', 'room', content['meeting_room1']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan
              </Button>
            </div>
          </ContentSection>

          <ContentSection title="Meeting Room 2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Ruangan</Label>
                  <Input value={getContent('meeting', 'room2', 'name')} onChange={(e) => updateField('meeting_room2', 'name', e.target.value)} placeholder="Business Center" />
                </div>
                <div>
                  <Label>Kapasitas</Label>
                  <Input value={getContent('meeting', 'room2', 'capacity')} onChange={(e) => updateField('meeting_room2', 'capacity', e.target.value)} placeholder="50 pax" />
                </div>
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea value={getContent('meeting', 'room2', 'description')} onChange={(e) => updateField('meeting_room2', 'description', e.target.value)} rows={3} />
              </div>
              <ImageField
                label="Gambar"
                value={getContent('meeting', 'room2', 'image')}
                onChange={(e) => updateField('meeting_room2', 'image', e.target.value)}
                onUpload={() => openMediaUpload('meeting_room2', 'image')}
              />
              <Button onClick={() => saveContent('meeting', 'room2', 'room', content['meeting_room2']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan
              </Button>
            </div>
          </ContentSection>
        </TabsContent>

        {/* ==================== WEDDING PAGE ==================== */}
        <TabsContent value="wedding" className="space-y-6">
          <ContentSection title="Wedding Page Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('wedding', 'hero', 'title')} onChange={(e) => updateField('wedding_hero', 'title', e.target.value)} placeholder="Wedding Venue" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('wedding', 'hero', 'subtitle')} onChange={(e) => updateField('wedding_hero', 'subtitle', e.target.value)} placeholder="Your Perfect Day" />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('wedding', 'hero', 'image')}
                onChange={(e) => updateField('wedding_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('wedding_hero', 'image')}
              />
              <Button onClick={() => saveContent('wedding', 'hero', 'hero', content['wedding_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          <ContentSection title="Wedding Package 1">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Paket</Label>
                  <Input value={getContent('wedding', 'package1', 'name')} onChange={(e) => updateField('wedding_package1', 'name', e.target.value)} placeholder="Intimate Garden" />
                </div>
                <div>
                  <Label>Harga</Label>
                  <Input value={getContent('wedding', 'package1', 'price')} onChange={(e) => updateField('wedding_package1', 'price', e.target.value)} placeholder="Rp 50.000.000" />
                </div>
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea value={getContent('wedding', 'package1', 'description')} onChange={(e) => updateField('wedding_package1', 'description', e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Fitur (pisahkan dengan baris baru)</Label>
                <Textarea value={getContent('wedding', 'package1', 'features')} onChange={(e) => updateField('wedding_package1', 'features', e.target.value)} rows={4} placeholder="Up to 100 guests&#10;Garden venue&#10;Catering included" />
              </div>
              <ImageField
                label="Gambar"
                value={getContent('wedding', 'package1', 'image')}
                onChange={(e) => updateField('wedding_package1', 'image', e.target.value)}
                onUpload={() => openMediaUpload('wedding_package1', 'image')}
              />
              <Button onClick={() => saveContent('wedding', 'package1', 'package', content['wedding_package1']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan
              </Button>
            </div>
          </ContentSection>

          <ContentSection title="Wedding Package 2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Paket</Label>
                  <Input value={getContent('wedding', 'package2', 'name')} onChange={(e) => updateField('wedding_package2', 'name', e.target.value)} placeholder="Grand Celebration" />
                </div>
                <div>
                  <Label>Harga</Label>
                  <Input value={getContent('wedding', 'package2', 'price')} onChange={(e) => updateField('wedding_package2', 'price', e.target.value)} placeholder="Rp 150.000.000" />
                </div>
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea value={getContent('wedding', 'package2', 'description')} onChange={(e) => updateField('wedding_package2', 'description', e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Fitur (pisahkan dengan baris baru)</Label>
                <Textarea value={getContent('wedding', 'package2', 'features')} onChange={(e) => updateField('wedding_package2', 'features', e.target.value)} rows={4} />
              </div>
              <ImageField
                label="Gambar"
                value={getContent('wedding', 'package2', 'image')}
                onChange={(e) => updateField('wedding_package2', 'image', e.target.value)}
                onUpload={() => openMediaUpload('wedding_package2', 'image')}
              />
              <Button onClick={() => saveContent('wedding', 'package2', 'package', content['wedding_package2']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan
              </Button>
            </div>
          </ContentSection>
        </TabsContent>

        {/* ==================== FACILITIES PAGE ==================== */}
        <TabsContent value="facilities" className="space-y-6">
          <ContentSection title="Facilities Page Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('facilities', 'hero', 'title')} onChange={(e) => updateField('facilities_hero', 'title', e.target.value)} placeholder="Our Facilities" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('facilities', 'hero', 'subtitle')} onChange={(e) => updateField('facilities_hero', 'subtitle', e.target.value)} placeholder="Premium Amenities" />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('facilities', 'hero', 'image')}
                onChange={(e) => updateField('facilities_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('facilities_hero', 'image')}
              />
              <Button onClick={() => saveContent('facilities', 'hero', 'hero', content['facilities_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          {[
            { key: 'pool', label: 'Infinity Pool' },
            { key: 'spa', label: 'Spa & Wellness' },
            { key: 'fitness', label: 'Fitness Center' },
            { key: 'restaurant', label: 'Restaurant & Bar' },
            { key: 'garden', label: 'Garden & Terrace' },
            { key: 'parking', label: 'Parking & Transport' }
          ].map((item) => (
            <ContentSection key={item.key} title={`Fasilitas: ${item.label}`}>
              <div className="space-y-4">
                <div>
                  <Label>Nama Fasilitas</Label>
                  <Input
                    value={getContent('facilities', item.key, 'name')}
                    onChange={(e) => updateField(`facilities_${item.key}`, 'name', e.target.value)}
                    placeholder={item.label}
                  />
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={getContent('facilities', item.key, 'description')}
                    onChange={(e) => updateField(`facilities_${item.key}`, 'description', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Jam Operasional / Info Tambahan</Label>
                  <Input
                    value={getContent('facilities', item.key, 'hours')}
                    onChange={(e) => updateField(`facilities_${item.key}`, 'hours', e.target.value)}
                    placeholder="e.g. 06:00 - 22:00"
                  />
                </div>
                <ImageField
                  label="Gambar"
                  value={getContent('facilities', item.key, 'image')}
                  onChange={(e) => updateField(`facilities_${item.key}`, 'image', e.target.value)}
                  onUpload={() => openMediaUpload(`facilities_${item.key}`, 'image')}
                />
                <Button onClick={() => saveContent('facilities', item.key, 'facility', content[`facilities_${item.key}`]?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-4 h-4 mr-2" />Simpan
                </Button>
              </div>
            </ContentSection>
          ))}

          <ContentSection title="Experience Complete Comfort (Info Bawah)">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input
                  value={getContent('facilities', 'info', 'title')}
                  onChange={(e) => updateField('facilities_info', 'title', e.target.value)}
                  placeholder="Experience Complete Comfort"
                />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea
                  value={getContent('facilities', 'info', 'description')}
                  onChange={(e) => updateField('facilities_info', 'description', e.target.value)}
                  rows={3}
                  placeholder="All facilities are available exclusively..."
                />
              </div>
              <Button onClick={() => saveContent('facilities', 'info', 'section', content['facilities_info']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Info
              </Button>
            </div>
          </ContentSection>
        </TabsContent>

        {/* ==================== GALLERY PAGE ==================== */}
        <TabsContent value="gallery" className="space-y-6">
          <ContentSection title="Gallery Page Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('gallery', 'hero', 'title')} onChange={(e) => updateField('gallery_hero', 'title', e.target.value)} placeholder="Gallery" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('gallery', 'hero', 'subtitle')} onChange={(e) => updateField('gallery_hero', 'subtitle', e.target.value)} placeholder="Explore Our Hotel" />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('gallery', 'hero', 'image')}
                onChange={(e) => updateField('gallery_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('gallery_hero', 'image')}
              />
              <Button onClick={() => saveContent('gallery', 'hero', 'hero', content['gallery_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          <ContentSection title="Gallery Images">
            <div className="space-y-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                const key = `gallery_item_${index}`;
                return (
                  <div key={index} className="flex gap-4 items-center p-3 bg-gray-50 rounded-lg">
                    {getContent('gallery', key, 'url') && (
                      <img src={getContent('gallery', key, 'url')} alt={`Gallery ${index + 1}`} className="w-20 h-14 object-cover rounded" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={getContent('gallery', key, 'url')}
                          onChange={(e) => updateField(`gallery_${key}`, 'url', e.target.value)}
                          placeholder="Image URL"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={() => openMediaUpload(`gallery_${key}`, 'url')}>
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={getContent('gallery', key, 'caption')}
                          onChange={(e) => updateField(`gallery_${key}`, 'caption', e.target.value)}
                          placeholder="Caption"
                          className="flex-1"
                        />
                        <select
                          value={getContent('gallery', key, 'category', 'general')}
                          onChange={(e) => updateField(`gallery_${key}`, 'category', e.target.value)}
                          className="border rounded px-2 text-sm"
                        >
                          <option value="general">General</option>
                          <option value="rooms">Rooms</option>
                          <option value="facilities">Facilities</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="events">Events</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      onClick={() => saveContent('gallery', key, 'image', { ...content[`gallery_${key}`]?.content, order: index })}
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
          </ContentSection>
        </TabsContent>

        {/* ==================== FOOTER ==================== */}
        <TabsContent value="footer" className="space-y-6">
          <ContentSection title="Informasi Kontak">
            <div className="space-y-4">
              <div>
                <Label>Deskripsi Hotel</Label>
                <Textarea
                  value={getContent('global', 'footer', 'description')}
                  onChange={(e) => updateField('global_footer', 'description', e.target.value)}
                  placeholder="Experience luxury and comfort in the heart of Batu city. Your perfect getaway destination."
                  rows={2}
                />
              </div>
              <div>
                <Label>Alamat</Label>
                <Textarea
                  value={getContent('global', 'footer', 'address')}
                  onChange={(e) => updateField('global_footer', 'address', e.target.value)}
                  placeholder="Jl. Raya Punten No.86, Punten, Kec. Bumiaji, Kota Batu, Jawa Timur 65338 Indonesia"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telepon</Label>
                  <Input value={getContent('global', 'footer', 'phone')} onChange={(e) => updateField('global_footer', 'phone', e.target.value)} placeholder="+6281130700206" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={getContent('global', 'footer', 'email')} onChange={(e) => updateField('global_footer', 'email', e.target.value)} placeholder="reservasi@spencergreenhotel.com" />
                </div>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Social Media Links">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>TikTok URL</Label>
                  <Input value={getContent('global', 'footer', 'tiktok')} onChange={(e) => updateField('global_footer', 'tiktok', e.target.value)} placeholder="https://tiktok.com/@..." />
                </div>
                <div>
                  <Label>Instagram URL</Label>
                  <Input value={getContent('global', 'footer', 'instagram')} onChange={(e) => updateField('global_footer', 'instagram', e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <Label>Facebook URL</Label>
                  <Input value={getContent('global', 'footer', 'facebook')} onChange={(e) => updateField('global_footer', 'facebook', e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <Input value={getContent('global', 'footer', 'whatsapp')} onChange={(e) => updateField('global_footer', 'whatsapp', e.target.value)} placeholder="6281130700206" />
                </div>
              </div>
              <Button onClick={() => saveContent('global', 'footer', 'info', content['global_footer']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Footer
              </Button>
            </div>
          </ContentSection>

          <ContentSection title="Google Maps">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input value={getContent('global', 'map', 'lat')} onChange={(e) => updateField('global_map', 'lat', e.target.value)} placeholder="-7.8332533" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={getContent('global', 'map', 'lng')} onChange={(e) => updateField('global_map', 'lng', e.target.value)} placeholder="112.5288334" />
                </div>
              </div>
              <Button onClick={() => saveContent('global', 'map', 'location', content['global_map']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Lokasi
              </Button>
            </div>
          </ContentSection>
        </TabsContent>
      </Tabs>

      {/* Media Upload Dialog */}
      <Dialog open={showMediaUpload} onOpenChange={setShowMediaUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <MediaUpload
            uploadEndpoint={`/media/upload/content-image?section=${uploadTarget?.key?.split('_')[0] || 'general'}`}
            acceptedTypes={uploadTarget?.mediaType === 'video' ? ['video/mp4', 'video/quicktime'] : ['image/jpeg', 'image/png', 'image/webp']}
            maxFileSize={uploadTarget?.mediaType === 'video' ? 500 * 1024 * 1024 : 10 * 1024 * 1024}
            title={uploadTarget?.mediaType === 'video' ? 'Upload Video' : 'Upload Image'}
            description={uploadTarget?.mediaType === 'video' ? 'Max 500MB, MP4/MOV' : 'Max 10MB, JPEG/PNG/WebP'}
            onUploadSuccess={handleMediaUpload}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
