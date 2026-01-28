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

const ImageField = ({ label, value, onChange, onUpload, altValue, onAltChange }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex gap-2">
      <Input value={value} onChange={onChange} placeholder="https://..." className="flex-1" />
      <Button type="button" variant="outline" onClick={onUpload}>
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </Button>
    </div>
    {value && (
      <div className="mt-2">
        <Label className="text-sm text-gray-600">Alt Text (untuk aksesibilitas)</Label>
        <Input
          value={altValue || ''}
          onChange={onAltChange}
          placeholder="Deskripsi gambar..."
          className="mt-1"
        />
        <img src={value} alt={altValue || 'Preview'} className="mt-2 rounded-lg h-24 object-cover" />
      </div>
    )}
  </div>
);


const ContentManagement = () => {
  const [content, setContent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);

  // Special Offers state
  const [offers, setOffers] = useState([]);
  const [editingOffer, setEditingOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchContent();
    fetchOffers();
  }, []);

  // Fetch special offers
  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${API_URL}/special-offers`);
      setOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const saveOffer = async (offerData) => {
    setIsSaving(true);
    try {
      if (editingOffer?.id) {
        await axios.put(`${API_URL}/admin/special-offers/${editingOffer.id}`, offerData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        toast.success('Offer berhasil diupdate');
      } else {
        await axios.post(`${API_URL}/admin/special-offers`, offerData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        toast.success('Offer berhasil ditambahkan');
      }
      fetchOffers();
      setShowOfferModal(false);
      setEditingOffer(null);
    } catch (error) {
      toast.error('Gagal menyimpan offer');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOffer = async (offerId) => {
    if (!window.confirm('Hapus offer ini?')) return;
    setIsSaving(true);
    try {
      await axios.delete(`${API_URL}/admin/special-offers/${offerId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Offer berhasil dihapus');
      fetchOffers();
    } catch (error) {
      toast.error('Gagal menghapus offer');
    } finally {
      setIsSaving(false);
    }
  };

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

  // Save all content for a specific page
  const saveAllForPage = async (page) => {
    setIsSaving(true);
    const sectionsToSave = Object.keys(content)
      .filter(key => key.startsWith(`${page}_`))
      .map(key => {
        const section = key.replace(`${page}_`, '');
        return { section, content: content[key]?.content };
      })
      .filter(item => item.content && Object.keys(item.content).length > 0);

    if (sectionsToSave.length === 0) {
      toast.info('Tidak ada perubahan untuk disimpan');
      setIsSaving(false);
      return;
    }

    try {
      await Promise.all(sectionsToSave.map(item =>
        axios.post(`${API_URL}/admin/content`, {
          page,
          section: item.section,
          content_type: 'section',
          content: item.content
        }, { headers: { Authorization: `Bearer ${getToken()}` } })
      ));
      toast.success(`Semua konten halaman ${page} berhasil disimpan (${sectionsToSave.length} section)`);
      fetchContent();
    } catch (error) {
      toast.error('Gagal menyimpan beberapa konten');
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

  const deleteContent = async (page, section) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setIsSaving(true);
    try {
      await axios.delete(`${API_URL}/admin/content/${page}/${section}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Konten berhasil dihapus');

      // Update local state
      setContent(prev => {
        const newContent = { ...prev };
        delete newContent[`${page}_${section}`];
        return newContent;
      });
    } catch (error) {
      toast.error('Gagal menghapus konten');
    } finally {
      setIsSaving(false);
    }
  };

  const addGalleryItem = () => {
    const timestamp = new Date().getTime();
    const section = `gallery_item_${timestamp}`;
    const key = `gallery_${section}`;
    updateField(key, 'url', '');
    updateField(key, 'caption', '');
    updateField(key, 'category', 'general');
    updateField(key, 'order', Object.keys(content).filter(k => k.startsWith('gallery_gallery_item_')).length);
  };

  // Sort gallery items by order
  const getGalleryItems = () => {
    return Object.keys(content)
      .filter(key => key.startsWith('gallery_gallery_item_'))
      .sort((a, b) => (content[a]?.content?.order || 0) - (content[b]?.content?.order || 0));
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
          <TabsTrigger value="offers">Special Offers</TabsTrigger>
          <TabsTrigger value="table-manner">Table Manner</TabsTrigger>
        </TabsList>

        {/* ==================== HOME PAGE ==================== */}
        <TabsContent value="home" className="space-y-6">
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Edit konten halaman Home</span>
            <Button onClick={() => saveAllForPage('home')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />Simpan Semua Perubahan
            </Button>
          </div>
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
                altValue={getContent('home', 'hero', 'imageAlt')}
                onAltChange={(e) => updateField('home_hero', 'imageAlt', e.target.value)}
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
                altValue={getContent('home', 'promo_banner', 'imageAlt')}
                onAltChange={(e) => updateField('home_promo_banner', 'imageAlt', e.target.value)}
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
          {/* About Section - Disabled temporarily
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
                altValue={getContent('home', 'about', 'imageAlt')}
                onAltChange={(e) => updateField('home_about', 'imageAlt', e.target.value)}
              />
              <Button onClick={() => saveContent('home', 'about', 'section', content['home_about']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan About
              </Button>
            </div>
          </ContentSection>
          */}
        </TabsContent>

        {/* ==================== ROOMS PAGE ==================== */}
        <TabsContent value="rooms" className="space-y-6">
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Edit konten halaman Rooms</span>
            <Button onClick={() => saveAllForPage('rooms')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />Simpan Semua Perubahan
            </Button>
          </div>
          <ContentSection title="Rooms Page Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('rooms', 'hero', 'title')} onChange={(e) => updateField('rooms_hero', 'title', e.target.value)} placeholder="Kamar Kami" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('rooms', 'hero', 'subtitle')} onChange={(e) => updateField('rooms_hero', 'subtitle', e.target.value)} placeholder="Akomodasi" />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('rooms', 'hero', 'image')}
                onChange={(e) => updateField('rooms_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('rooms_hero', 'image')}
                altValue={getContent('rooms', 'hero', 'imageAlt')}
                onAltChange={(e) => updateField('rooms_hero', 'imageAlt', e.target.value)}
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
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Edit konten halaman Meeting</span>
            <Button onClick={() => saveAllForPage('meeting')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />Simpan Semua Perubahan
            </Button>
          </div>
          <ContentSection title="Meeting Page Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('meeting', 'hero', 'title')} onChange={(e) => updateField('meeting_hero', 'title', e.target.value)} placeholder="Meeting & Events" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('meeting', 'hero', 'subtitle')} onChange={(e) => updateField('meeting_hero', 'subtitle', e.target.value)} placeholder="Corporate Events" />
              </div>
              <div>
                <Label>Deskripsi Hero</Label>
                <Textarea value={getContent('meeting', 'hero', 'description')} onChange={(e) => updateField('meeting_hero', 'description', e.target.value)} placeholder="Host your next corporate event..." rows={2} />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('meeting', 'hero', 'image')}
                onChange={(e) => updateField('meeting_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('meeting_hero', 'image')}
                altValue={getContent('meeting', 'hero', 'imageAlt')}
                onAltChange={(e) => updateField('meeting_hero', 'imageAlt', e.target.value)}
              />
              <Button onClick={() => saveContent('meeting', 'hero', 'hero', content['meeting_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          {/* Meeting Rooms */}
          {[1, 2, 3].map((num) => (
            <ContentSection key={`room${num}`} title={`Meeting Room ${num}`}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama Ruangan</Label>
                    <Input value={getContent('meeting', `room${num}`, 'name')} onChange={(e) => updateField(`meeting_room${num}`, 'name', e.target.value)} placeholder="Boardroom" />
                  </div>
                  <div>
                    <Label>Kapasitas</Label>
                    <Input value={getContent('meeting', `room${num}`, 'capacity')} onChange={(e) => updateField(`meeting_room${num}`, 'capacity', e.target.value)} placeholder="10 - 20 pax" />
                  </div>
                </div>
                <div>
                  <Label>Fitur (pisahkan dengan koma)</Label>
                  <Input value={getContent('meeting', `room${num}`, 'features')} onChange={(e) => updateField(`meeting_room${num}`, 'features', e.target.value)} placeholder="4K Display, Video Conference, Whiteboard" />
                </div>
                <ImageField
                  label="Gambar"
                  value={getContent('meeting', `room${num}`, 'image')}
                  onChange={(e) => updateField(`meeting_room${num}`, 'image', e.target.value)}
                  onUpload={() => openMediaUpload(`meeting_room${num}`, 'image')}
                  altValue={getContent('meeting', `room${num}`, 'imageAlt')}
                  onAltChange={(e) => updateField(`meeting_room${num}`, 'imageAlt', e.target.value)}
                />
                <Button onClick={() => saveContent('meeting', `room${num}`, 'room', content[`meeting_room${num}`]?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-4 h-4 mr-2" />Simpan Room {num}
                </Button>
              </div>
            </ContentSection>
          ))}

          {/* Meeting Packages */}
          {[1, 2, 3].map((num) => (
            <ContentSection key={`pkg${num}`} title={`Meeting Package ${num}`}>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Nama Paket</Label>
                    <Input value={getContent('meeting', `package${num}`, 'name')} onChange={(e) => updateField(`meeting_package${num}`, 'name', e.target.value)} placeholder="Half Day" />
                  </div>
                  <div>
                    <Label>Durasi</Label>
                    <Input value={getContent('meeting', `package${num}`, 'duration')} onChange={(e) => updateField(`meeting_package${num}`, 'duration', e.target.value)} placeholder="4 Hours" />
                  </div>
                  <div>
                    <Label>Harga</Label>
                    <Input value={getContent('meeting', `package${num}`, 'price')} onChange={(e) => updateField(`meeting_package${num}`, 'price', e.target.value)} placeholder="Rp 500.000/pax" />
                  </div>
                </div>
                <div>
                  <Label>Termasuk (pisahkan dengan baris baru)</Label>
                  <Textarea value={getContent('meeting', `package${num}`, 'includes')} onChange={(e) => updateField(`meeting_package${num}`, 'includes', e.target.value)} rows={3} placeholder="1x Coffee Break&#10;Meeting Room&#10;WiFi" />
                </div>
                <Button onClick={() => saveContent('meeting', `package${num}`, 'package', content[`meeting_package${num}`]?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-4 h-4 mr-2" />Simpan Package {num}
                </Button>
              </div>
            </ContentSection>
          ))}

          {/* Meeting CTA */}
          <ContentSection title="CTA Section (Bawah)">
            <div className="space-y-4">
              <div>
                <Label>Judul CTA</Label>
                <Input value={getContent('meeting', 'cta', 'title')} onChange={(e) => updateField('meeting_cta', 'title', e.target.value)} placeholder="Plan Your Next Event" />
              </div>
              <div>
                <Label>Deskripsi CTA</Label>
                <Textarea value={getContent('meeting', 'cta', 'description')} onChange={(e) => updateField('meeting_cta', 'description', e.target.value)} rows={2} placeholder="Our dedicated events team..." />
              </div>
              <Button onClick={() => saveContent('meeting', 'cta', 'cta', content['meeting_cta']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan CTA
              </Button>
            </div>
          </ContentSection>
        </TabsContent>

        {/* ==================== WEDDING PAGE ==================== */}
        <TabsContent value="wedding" className="space-y-6">
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Edit konten halaman Wedding</span>
            <Button onClick={() => saveAllForPage('wedding')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />Simpan Semua Perubahan
            </Button>
          </div>
          <ContentSection title="Wedding Page Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('wedding', 'hero', 'title')} onChange={(e) => updateField('wedding_hero', 'title', e.target.value)} placeholder="Your Dream Wedding" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('wedding', 'hero', 'subtitle')} onChange={(e) => updateField('wedding_hero', 'subtitle', e.target.value)} placeholder="Create unforgettable memories..." />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('wedding', 'hero', 'image')}
                onChange={(e) => updateField('wedding_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('wedding_hero', 'image')}
                altValue={getContent('wedding', 'hero', 'imageAlt')}
                onAltChange={(e) => updateField('wedding_hero', 'imageAlt', e.target.value)}
              />
              <Button onClick={() => saveContent('wedding', 'hero', 'hero', content['wedding_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          {/* Wedding Venues */}
          {[1, 2, 3].map((num) => (
            <ContentSection key={`venue${num}`} title={`Wedding Venue ${num}`}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama Venue</Label>
                    <Input value={getContent('wedding', `venue${num}`, 'name')} onChange={(e) => updateField(`wedding_venue${num}`, 'name', e.target.value)} placeholder="Grand Ballroom" />
                  </div>
                  <div>
                    <Label>Kapasitas</Label>
                    <Input value={getContent('wedding', `venue${num}`, 'capacity')} onChange={(e) => updateField(`wedding_venue${num}`, 'capacity', e.target.value)} placeholder="300 - 500 guests" />
                  </div>
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Textarea value={getContent('wedding', `venue${num}`, 'description')} onChange={(e) => updateField(`wedding_venue${num}`, 'description', e.target.value)} rows={2} placeholder="Our magnificent ballroom..." />
                </div>
                <ImageField
                  label="Gambar"
                  value={getContent('wedding', `venue${num}`, 'image')}
                  onChange={(e) => updateField(`wedding_venue${num}`, 'image', e.target.value)}
                  onUpload={() => openMediaUpload(`wedding_venue${num}`, 'image')}
                  altValue={getContent('wedding', `venue${num}`, 'imageAlt')}
                  onAltChange={(e) => updateField(`wedding_venue${num}`, 'imageAlt', e.target.value)}
                />
                <Button onClick={() => saveContent('wedding', `venue${num}`, 'venue', content[`wedding_venue${num}`]?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-4 h-4 mr-2" />Simpan Venue {num}
                </Button>
              </div>
            </ContentSection>
          ))}

          {/* Wedding Services */}
          {[
            { num: 1, default: 'Floral Design' },
            { num: 2, default: 'Catering' },
            { num: 3, default: 'Photography' },
            { num: 4, default: 'Entertainment' }
          ].map((svc) => (
            <ContentSection key={`service${svc.num}`} title={`Wedding Service ${svc.num}`}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama Service</Label>
                    <Input value={getContent('wedding', `service${svc.num}`, 'name')} onChange={(e) => updateField(`wedding_service${svc.num}`, 'name', e.target.value)} placeholder={svc.default} />
                  </div>
                  <div>
                    <Label>Deskripsi Singkat</Label>
                    <Input value={getContent('wedding', `service${svc.num}`, 'description')} onChange={(e) => updateField(`wedding_service${svc.num}`, 'description', e.target.value)} placeholder="Custom floral arrangements" />
                  </div>
                </div>
                <Button onClick={() => saveContent('wedding', `service${svc.num}`, 'service', content[`wedding_service${svc.num}`]?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-4 h-4 mr-2" />Simpan Service {svc.num}
                </Button>
              </div>
            </ContentSection>
          ))}

          {/* Wedding CTA */}
          <ContentSection title="CTA Section (Bawah)">
            <div className="space-y-4">
              <div>
                <Label>Judul CTA</Label>
                <Input value={getContent('wedding', 'cta', 'title')} onChange={(e) => updateField('wedding_cta', 'title', e.target.value)} placeholder="Begin Your Forever" />
              </div>
              <div>
                <Label>Deskripsi CTA</Label>
                <Textarea value={getContent('wedding', 'cta', 'description')} onChange={(e) => updateField('wedding_cta', 'description', e.target.value)} rows={2} placeholder="Let us help you plan the wedding of your dreams" />
              </div>
              <Button onClick={() => saveContent('wedding', 'cta', 'cta', content['wedding_cta']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan CTA
              </Button>
            </div>
          </ContentSection>
        </TabsContent>

        {/* ==================== FACILITIES PAGE ==================== */}
        <TabsContent value="facilities" className="space-y-6">
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Edit konten halaman Facilities</span>
            <Button onClick={() => saveAllForPage('facilities')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />Simpan Semua Perubahan
            </Button>
          </div>
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
                altValue={getContent('facilities', 'hero', 'imageAlt')}
                onAltChange={(e) => updateField('facilities_hero', 'imageAlt', e.target.value)}
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
                  altValue={getContent('facilities', item.key, 'imageAlt')}
                  onAltChange={(e) => updateField(`facilities_${item.key}`, 'imageAlt', e.target.value)}
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
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Edit konten halaman Gallery</span>
            <Button onClick={() => saveAllForPage('gallery')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />Simpan Semua Perubahan
            </Button>
          </div>
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
                altValue={getContent('gallery', 'hero', 'imageAlt')}
                onAltChange={(e) => updateField('gallery_hero', 'imageAlt', e.target.value)}
              />
              <Button onClick={() => saveContent('gallery', 'hero', 'hero', content['gallery_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          <ContentSection title="Gallery Images">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  Upload unlimited photos. Use Order to sort them.
                </p>
                <Button onClick={addGalleryItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </Button>
              </div>
              {getGalleryItems().map((key) => {
                const sectionName = key.replace('gallery_', '');
                return (
                  <div key={key} className="flex gap-4 items-center p-3 bg-gray-50 rounded-lg">
                    {getContent('gallery', sectionName, 'url') && (
                      <img src={getContent('gallery', sectionName, 'url')} alt="Gallery" className="w-20 h-14 object-cover rounded" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={getContent('gallery', sectionName, 'url')}
                          onChange={(e) => updateField(key, 'url', e.target.value)}
                          placeholder="Image URL"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={() => openMediaUpload(key, 'url')}>
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={getContent('gallery', sectionName, 'alt')}
                          onChange={(e) => updateField(key, 'alt', e.target.value)}
                          placeholder="Alt Text (deskripsi gambar)"
                          className="flex-[2]"
                        />
                        <Input
                          value={getContent('gallery', sectionName, 'caption')}
                          onChange={(e) => updateField(key, 'caption', e.target.value)}
                          placeholder="Caption"
                          className="flex-[2]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={getContent('gallery', sectionName, 'order', 0)}
                          onChange={(e) => updateField(key, 'order', parseInt(e.target.value))}
                          placeholder="Order"
                          className="w-20"
                        />
                        <select
                          value={getContent('gallery', sectionName, 'category', 'general')}
                          onChange={(e) => updateField(key, 'category', e.target.value)}
                          className="border rounded px-2 text-sm flex-1"
                        >
                          <option value="general">General</option>
                          <option value="rooms">Rooms</option>
                          <option value="facilities">Facilities</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="events">Events</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={() => saveContent('gallery', sectionName, 'image', content[key]?.content)}
                        disabled={isSaving}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteContent('gallery', sectionName)}
                        disabled={isSaving}
                        size="sm"
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {getGalleryItems().length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  No images yet. Click "Add Image" to start.
                </div>
              )}
            </div>
          </ContentSection>
        </TabsContent>

        {/* ==================== TABLE MANNER PAGE ==================== */}
        <TabsContent value="table-manner" className="space-y-6">
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Edit konten halaman Table Manner</span>
            <Button onClick={() => saveAllForPage('table-manner')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />Simpan Semua Perubahan
            </Button>
          </div>
          <ContentSection title="Table Manner Hero">
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={getContent('table-manner', 'hero', 'title')} onChange={(e) => updateField('table-manner_hero', 'title', e.target.value)} placeholder="Paket Table Manner" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={getContent('table-manner', 'hero', 'subtitle')} onChange={(e) => updateField('table-manner_hero', 'subtitle', e.target.value)} placeholder="Etiquette Training" />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea value={getContent('table-manner', 'hero', 'description')} onChange={(e) => updateField('table-manner_hero', 'description', e.target.value)} rows={2} placeholder="Pelajari etika makan..." />
              </div>
              <ImageField
                label="Background Image"
                value={getContent('table-manner', 'hero', 'image')}
                onChange={(e) => updateField('table-manner_hero', 'image', e.target.value)}
                onUpload={() => openMediaUpload('table-manner_hero', 'image')}
                altValue={getContent('table-manner', 'hero', 'imageAlt')}
                onAltChange={(e) => updateField('table-manner_hero', 'imageAlt', e.target.value)}
              />
              <Button onClick={() => saveContent('table-manner', 'hero', 'hero', content['table-manner_hero']?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />Simpan Hero
              </Button>
            </div>
          </ContentSection>

          {/* Table Manner Packages */}
          {[1, 2, 3].map((num) => (
            <ContentSection key={`pkg${num}`} title={`Package ${num}`}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Nama Paket</Label>
                    <Input value={getContent('table-manner', `package${num}`, 'name')} onChange={(e) => updateField(`table-manner_package${num}`, 'name', e.target.value)} placeholder={`Paket ${num}`} />
                  </div>
                  <div>
                    <Label>Pax (Kapasitas)</Label>
                    <Input value={getContent('table-manner', `package${num}`, 'pax')} onChange={(e) => updateField(`table-manner_package${num}`, 'pax', e.target.value)} placeholder="20 - 30 pax" />
                  </div>
                  <div>
                    <Label>Harga</Label>
                    <Input value={getContent('table-manner', `package${num}`, 'price')} onChange={(e) => updateField(`table-manner_package${num}`, 'price', e.target.value)} placeholder="Rp 150.000/pax" />
                  </div>
                </div>
                <div>
                  <Label>Termasuk (pisahkan dengan baris baru)</Label>
                  <Textarea
                    value={getContent('table-manner', `package${num}`, 'includes')}
                    onChange={(e) => updateField(`table-manner_package${num}`, 'includes', e.target.value)}
                    rows={3}
                    placeholder="Materi Etika Makan&#10;Praktek Langsung"
                  />
                </div>
                <ImageField
                  label="Gambar Paket"
                  value={getContent('table-manner', `package${num}`, 'image')}
                  onChange={(e) => updateField(`table-manner_package${num}`, 'image', e.target.value)}
                  onUpload={() => openMediaUpload(`table-manner_package${num}`, 'image')}
                  altValue={getContent('table-manner', `package${num}`, 'imageAlt')}
                  onAltChange={(e) => updateField(`table-manner_package${num}`, 'imageAlt', e.target.value)}
                />
                <Button onClick={() => saveContent('table-manner', `package${num}`, 'package', content[`table-manner_package${num}`]?.content || {})} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-4 h-4 mr-2" />Simpan Package {num}
                </Button>
              </div>
            </ContentSection>
          ))}
        </TabsContent>

        {/* ==================== FOOTER ==================== */}
        <TabsContent value="footer" className="space-y-6">
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Edit konten Footer (Global)</span>
            <Button onClick={() => saveAllForPage('global')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />Simpan Semua Perubahan
            </Button>
          </div>
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
                  placeholder="Jl. Raya Punten No.86, Kec. Bumiaji, Kota Batu, Jawa Timur 65338 Indonesia"
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

        {/* ==================== SPECIAL OFFERS ==================== */}
        <TabsContent value="offers" className="space-y-6">
          <div className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm py-3 -mt-3 -mx-1 px-1 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Kelola Special Offers di halaman Home</span>
            <Button onClick={() => { setEditingOffer({}); setShowOfferModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />Tambah Offer
            </Button>
          </div>

          {offers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-soft text-center text-gray-500">
              Belum ada special offers. Klik "Tambah Offer" untuk membuat.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-xl shadow-soft overflow-hidden">
                  {offer.image && (
                    <img src={offer.image} alt={offer.title} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">{offer.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{offer.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{offer.code}</span>
                      <span className="text-xs text-gray-500">s/d {offer.validUntil}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => { setEditingOffer(offer); setShowOfferModal(true); }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => deleteOffer(offer.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Special Offer Edit Modal */}
      <Dialog open={showOfferModal} onOpenChange={(v) => { setShowOfferModal(v); if (!v) setEditingOffer(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOffer?.id ? 'Edit Offer' : 'Tambah Offer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            saveOffer({
              title: formData.get('title'),
              description: formData.get('description'),
              code: formData.get('code'),
              image: formData.get('image'),
              validUntil: formData.get('validUntil')
            });
          }} className="space-y-4">
            <div>
              <Label>Judul Offer</Label>
              <Input name="title" defaultValue={editingOffer?.title || ''} placeholder="Weekend Escape" required />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea name="description" defaultValue={editingOffer?.description || ''} placeholder="Get 25% off..." rows={3} required />
            </div>
            <div>
              <Label>Kode Promo</Label>
              <Input name="code" defaultValue={editingOffer?.code || ''} placeholder="WEEKEND25" required />
            </div>
            <div>
              <Label>URL Gambar</Label>
              <Input name="image" defaultValue={editingOffer?.image || ''} placeholder="https://..." />
              {editingOffer?.image && (
                <img src={editingOffer.image} alt="Preview" className="mt-2 rounded h-20 object-cover" />
              )}
            </div>
            <div>
              <Label>Berlaku Sampai</Label>
              <Input name="validUntil" defaultValue={editingOffer?.validUntil || ''} placeholder="31 Jan 2026" required />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowOfferModal(false)}>Batal</Button>
              <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />{isSaving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
