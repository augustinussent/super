import { useState, useEffect } from 'react';
import { Save, Mail, FileText, DollarSign, Layout, List, Eye } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// --- LIVE PREVIEW COMPONENT ---
const EmailPreview = ({ config }) => {
    // Dummy Data for Preview
    const dummy = {
        booking_code: "RES-123456",
        guest_name: "John Doe",
        guest_email: "john@example.com",
        guest_phone: "+62 812 3456 7890",
        check_in: "10 Feb 2026",
        check_out: "12 Feb 2026",
        nights: 2,
        guests: 2,
        room_type: "Deluxe Room",
        rate_plan: "Breakfast Included",
        special_req: "Non-smoking room",
        total_amount: "1.500.000 IDR",
        room_charge: "1.500.000 IDR"
    };

    const labels = config.labels;
    const payment = config.payment_details;

    // Helper to format strings safely
    const formatString = (template, data) => {
        try {
            return template.replace(/{(\w+)}/g, (_, k) => data[k] || `{${k}}`);
        } catch (e) {
            return template;
        }
    };

    return (
        <div className="text-left" style={{ fontFamily: "'Nunito', sans-serif" }}>
            {/* Header */}
            <div style={{ backgroundColor: '#059669', padding: '10px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <img src={config.logo_url} alt="Logo" style={{ maxHeight: '40px', width: 'auto' }} />
                <div className="text-right">
                    <span className="block text-xs font-bold">{config.header_text_top}</span>
                    <span className="block text-xs opacity-80">{config.header_text_bottom}</span>
                </div>
            </div>

            {/* Hero Image */}
            <img src={config.hero_image_url} alt="Hotel" className="w-full h-auto min-h-[200px] bg-gray-200" />

            {/* Content */}
            <div className="p-6">
                {/* Greeting */}
                <div className="my-6 text-gray-700">
                    <strong className="block text-lg mb-2">{formatString(config.greeting_template, dummy)}</strong>
                    <p className="text-sm leading-relaxed">{config.intro_text}</p>
                </div>

                {/* Grid Table */}
                <table className="w-full border-spacing-0 mt-6">
                    <tbody>
                        <tr>
                            <td className="p-4 border-b border-gray-200 w-1/2 align-top">
                                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{labels.reservation_number}</span>
                                <span className="block text-gray-900 text-xl font-bold text-emerald-600">{dummy.booking_code}</span>
                            </td>
                            <td className="p-4 border-b border-gray-200 w-1/2 align-top text-right">
                                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{labels.status}</span>
                                <span className="block text-gray-900 text-lg font-bold">Confirmed</span>
                            </td>
                        </tr>
                        <tr>
                            <td className="p-4 border-b border-gray-200 align-top">
                                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{labels.check_in}</span>
                                <span className="block text-gray-900 text-xl font-bold">{dummy.check_in}</span>
                                <small className="text-gray-500">14:00</small>
                            </td>
                            <td className="p-4 border-b border-gray-200 align-top border-l border-gray-200">
                                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{labels.check_out}</span>
                                <span className="block text-gray-900 text-xl font-bold">{dummy.check_out}</span>
                                <small className="text-gray-500">12:00</small>
                            </td>
                        </tr>
                        <tr>
                            <td className="p-4 border-b border-gray-200 align-top">
                                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{labels.guests}</span>
                                <span className="block text-gray-900 text-xl font-bold">{dummy.guests} Orang</span>
                            </td>
                            <td className="p-4 border-b border-gray-200 align-top border-l border-gray-200">
                                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{labels.stay}</span>
                                <span className="block text-gray-900 text-xl font-bold">{dummy.nights} Malam</span>
                            </td>
                        </tr>
                        <tr>
                            <td className="p-4 align-top">
                                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{labels.reservation_under}</span>
                                <span className="block text-gray-900 font-bold">{dummy.guest_name}</span>
                            </td>
                            <td className="p-4 align-top border-l border-gray-200">
                                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{labels.contact}</span>
                                <div className="text-sm text-gray-700">
                                    {dummy.guest_phone}<br />
                                    <span className="text-emerald-600">{dummy.guest_email}</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Room Details */}
                <div className="mt-10 mb-4 text-xl font-bold text-gray-900">{labels.room_details}</div>
                <div className="border border-gray-200 p-4 rounded bg-white">
                    <div className="bg-gray-100 p-2 mb-3 font-bold text-sm">Room 1</div>
                    <table className="w-full text-sm text-gray-700">
                        <tbody>
                            <tr><td className="py-1 font-bold w-32">{labels.room_type}</td><td>{dummy.room_type}</td></tr>
                            <tr><td className="py-1 font-bold">{labels.rate_plan}</td><td>{dummy.rate_plan}</td></tr>
                            <tr><td className="py-1 font-bold">{labels.special_req}</td><td>{dummy.special_req}</td></tr>
                        </tbody>
                    </table>

                    <table className="w-full border-collapse mt-4 border border-gray-200">
                        <thead>
                            <tr>
                                <th className="bg-gray-50 p-2 text-left text-xs font-bold text-gray-700">{labels.description}</th>
                                <th className="bg-gray-50 p-2 text-right text-xs font-bold text-gray-700">{labels.total}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-2 border-t border-gray-200 text-sm">{labels.room_charge.replace('{nights}', dummy.nights)}</td>
                                <td className="p-2 border-t border-gray-200 text-right text-sm">{dummy.room_charge}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border-t border-gray-200 text-sm font-bold">{labels.total_amount}</td>
                                <td className="p-2 border-t border-gray-200 text-right text-sm font-bold text-emerald-600">{dummy.total_amount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Payment Section */}
                {config.show_payment && config.payment_details.show && (
                    <>
                        <div className="bg-emerald-600 text-white p-4 mt-8 font-bold text-lg">{labels.payment_info}</div>
                        <div className="border border-emerald-600 bg-emerald-50 p-4 rounded text-sm text-gray-800">
                            <p className="m-0 leading-relaxed">
                                <strong>{labels.bank}</strong> {payment.bank_name}<br />
                                <strong>{labels.account}</strong> {payment.account_number}<br />
                                <strong>{labels.holder}</strong> {payment.account_holder}<br />
                                <strong>{labels.amount}</strong> <span className="text-lg font-bold text-emerald-700">{dummy.total_amount}</span>
                            </p>
                        </div>
                    </>
                )}

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-300 p-4 mt-6 rounded text-sm text-yellow-900">
                    <strong className="block mb-2">{labels.important_notes}</strong>
                    <ul className="list-disc pl-5 m-0 space-y-1">
                        {config.important_notes_list.map((note, i) => <li key={i}>{note}</li>)}
                    </ul>
                </div>

                {/* Policy */}
                {config.show_policy && (
                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-3 text-gray-900">{labels.cancellation_policy}</h3>
                        <div className="border border-gray-200 p-4 rounded text-sm text-gray-600">
                            <ul className="list-disc pl-5 m-0 space-y-1">
                                {config.cancellation_policy_list.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-emerald-600 text-white py-8 px-6 text-center mt-10">
                <p className="text-sm m-0">&copy; {new Date().getFullYear()} Spencer Green Hotel</p>
                <p className="text-xs opacity-75 mt-1">{config.footer_address}</p>
                <div className="mt-4">
                    <span className="text-white text-sm mx-2 underline cursor-pointer">{labels.website}</span>
                </div>
            </div>
        </div>
    )
}


const { getToken, hasPermission } = useAuth();
const [loading, setLoading] = useState(false);
const [scale, setScale] = useState(1);

// Scale adjustment for smaller screens
useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 1400) {
            setScale(0.85); // Auto-scale for laptops
        } else {
            setScale(1);
        }
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);

// Default config matching backend
const [config, setConfig] = useState({
    subject_template: "Konfirmasi Reservasi - {booking_code}",
    logo_url: "https://res.cloudinary.com/dgfjos8xa/image/upload/v1769523647/logo_spencer_green_hotel_batu_malang_512_inv_h0zm3e.png",
    hero_image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?fit=crop&w=1200&q=80",
    header_text_top: "SPENCER GREEN HOTEL",
    header_text_bottom: "Batu, Jawa Timur",
    greeting_template: "Hai {guest_name}!",
    intro_text: "Terima kasih telah memilih Spencer Green Hotel. Kami berkomitmen untuk memberikan pengalaman menginap yang nyaman bagi Anda.",
    labels: {
        reservation_number: "NOMOR RESERVASI",
        status: "STATUS",
        check_in: "CHECK-IN",
        check_out: "CHECK-OUT",
        guests: "TAMU",
        stay: "DURASI",
        reservation_under: "PEMESAN",
        contact: "KONTAK",
        room_details: "Detail Kamar",
        room_type: "Tipe Kamar:",
        rate_plan: "Paket:",
        special_req: "Permintaan Khusus:",
        description: "Deskripsi",
        total: "Total",
        room_charge: "Biaya Kamar ({nights} malam)",
        total_amount: "Total Tagihan",
        payment_info: "Silakan transfer pembayaran ke:",
        bank: "Bank:",
        account: "No. Rekening:",
        holder: "Atas Nama:",
        amount: "Nominal:",
        important_notes: "Catatan Penting:",
        cancellation_policy: "Kebijakan Pembatalan",
        website: "Website"
    },
    payment_details: {
        bank_name: "BCA (Bank Central Asia)",
        account_number: "788-095-1909",
        account_holder: "PT. SPENCER GREEN",
        show: true
    },
    important_notes_list: [
        "Pembayaran harus diselesaikan dalam waktu 24 jam.",
        "Mohon kirimkan bukti transfer melalui WhatsApp atau Email.",
        "Non-refundable kecuali dinyatakan lain."
    ],
    cancellation_policy_list: [
        "Harga total dibayarkan saat pemesanan.",
        "Ketidakhadiran (No-Show) tidak dapat dikembalikan."
    ],
    footer_address: "Jl. Raya Punten No.86, Kec. Bumiaji, Kota Batu, Jawa Timur 65338 Indonesia",
    show_payment: true,
    show_policy: true
});

useEffect(() => {
    fetchConfig();
}, []);

const fetchConfig = async () => {
    try {
        setLoading(true);
        const token = await getToken();
        const response = await axios.get(`${API_URL}/content/email`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Check if we have specific section
        const found = response.data.find(c => c.section === 'reservation_conf');
        if (found && found.content) {
            // Merge with default to ensure structure
            setConfig(prev => ({
                ...prev,
                ...found.content,
                labels: { ...prev.labels, ...found.content.labels },
                payment_details: { ...prev.payment_details, ...found.content.payment_details }
            }));
        }
    } catch (error) {
        console.error('Error fetching email config:', error);
    } finally {
        setLoading(false);
    }
};

const handleSave = async () => {
    if (!hasPermission('email_config')) {
        toast.error('Anda tidak memiliki izin untuk menyimpan konten.');
        return;
    }

    try {
        setLoading(true);
        const token = await getToken();
        const payload = {
            page: 'email',
            section: 'reservation_conf',
            content_type: 'config',
            content: config
        };

        await axios.post(`${API_URL}/admin/content`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        toast.success('Konfigurasi email berhasil disimpan');
    } catch (error) {
        console.error('Error saving config:', error);
        toast.error('Gagal menyimpan konfigurasi');
    } finally {
        setLoading(false);
    }
};

const updateField = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
};

const updateLabel = (key, value) => {
    setConfig(prev => ({
        ...prev,
        labels: { ...prev.labels, [key]: value }
    }));
};

const updatePayment = (key, value) => {
    setConfig(prev => ({
        ...prev,
        payment_details: { ...prev.payment_details, [key]: value }
    }));
};

const updateList = (field, index, value) => {
    const newList = [...config[field]];
    newList[index] = value;
    setConfig(prev => ({ ...prev, [field]: newList }));
};

const addListItem = (field) => {
    setConfig(prev => ({ ...prev, [field]: [...prev[field], "Baru..."] }));
};

const removeListItem = (field, index) => {
    const newList = config[field].filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, [field]: newList }));
};

return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Template Email Reservasi
            </h1>
            <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
            </Button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">

            {/* LEFT COLUMN - EDITOR (SCROLLABLE) */}
            <div className="space-y-6 overflow-y-auto pr-2 pb-20">
                {/* General Settings */}
                <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                    <h2 className="font-semibold flex items-center gap-2 text-emerald-800">
                        <Layout className="w-5 h-5" />
                        Pengaturan Umum
                    </h2>

                    <div className="space-y-2">
                        <Label>Template Subjek Email</Label>
                        <Input
                            value={config.subject_template}
                            onChange={e => updateField('subject_template', e.target.value)}
                            placeholder="Konfirmasi Reservasi - {booking_code}"
                        />
                        <p className="text-xs text-gray-500">Gunakan placeholders: {'{booking_code}'}, {'{guest_name}'}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>URL Logo Hotel</Label>
                        <Input
                            value={config.logo_url || ''}
                            onChange={e => updateField('logo_url', e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>URL Gambar Utama (Hero)</Label>
                        <Input
                            value={config.hero_image_url || ''}
                            onChange={e => updateField('hero_image_url', e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Judul Header (Atas)</Label>
                            <Input
                                value={config.header_text_top}
                                onChange={e => updateField('header_text_top', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sub-Judul Header (Bawah)</Label>
                            <Input
                                value={config.header_text_bottom}
                                onChange={e => updateField('header_text_bottom', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Template Salam Pembuka</Label>
                        <Input
                            value={config.greeting_template}
                            onChange={e => updateField('greeting_template', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Teks Pengantar</Label>
                        <Textarea
                            value={config.intro_text}
                            onChange={e => updateField('intro_text', e.target.value)}
                            className="h-24"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Alamat Footer</Label>
                        <Textarea
                            value={config.footer_address}
                            onChange={e => updateField('footer_address', e.target.value)}
                        />
                    </div>
                </div>

                {/* Payment Settings */}
                <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-semibold flex items-center gap-2 text-emerald-800">
                            <DollarSign className="w-5 h-5" />
                            Informasi Pembayaran
                        </h2>
                        <Switch
                            checked={config.show_payment}
                            onCheckedChange={c => updateField('show_payment', c)}
                        />
                    </div>

                    {config.show_payment && (
                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={config.payment_details.show}
                                    onCheckedChange={c => updatePayment('show', c)}
                                />
                                <Label>Tampilkan Detail Bank</Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Nama Bank</Label>
                                    <Input
                                        value={config.payment_details.bank_name}
                                        onChange={e => updatePayment('bank_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Nomor Rekening</Label>
                                    <Input
                                        value={config.payment_details.account_number}
                                        onChange={e => updatePayment('account_number', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>Atas Nama</Label>
                                <Input
                                    value={config.payment_details.account_holder}
                                    onChange={e => updatePayment('account_holder', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Lists Configuration */}
                <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
                    <h2 className="font-semibold flex items-center gap-2 text-emerald-800">
                        <List className="w-5 h-5" />
                        Daftar & Kebijakan
                    </h2>

                    {/* Important Notes */}
                    <div className="space-y-3">
                        <Label className="font-bold text-gray-700">Catatan Penting</Label>
                        <div className="space-y-2">
                            {config.important_notes_list.map((note, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={note}
                                        onChange={e => updateList('important_notes_list', idx, e.target.value)}
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeListItem('important_notes_list', idx)}>
                                        <span className="text-red-500">×</span>
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addListItem('important_notes_list')} className="w-full">
                                + Tambah Catatan
                            </Button>
                        </div>
                    </div>

                    {/* Cancellation Policy */}
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <Label className="font-bold text-gray-700">Kebijakan Pembatalan</Label>
                            <Switch
                                checked={config.show_policy}
                                onCheckedChange={c => updateField('show_policy', c)}
                            />
                        </div>

                        {config.show_policy && (
                            <div className="space-y-2">
                                {config.cancellation_policy_list.map((item, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={e => updateList('cancellation_policy_list', idx, e.target.value)}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeListItem('cancellation_policy_list', idx)}>
                                            <span className="text-red-500">×</span>
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => addListItem('cancellation_policy_list')} className="w-full">
                                    + Tambah Poin Kebijakan
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Translation / Labels */}
                <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                    <h2 className="font-semibold flex items-center gap-2 text-emerald-800">
                        <FileText className="w-5 h-5" />
                        Label & Terjemahan
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(config.labels).map(([key, val]) => (
                            <div key={key} className="space-y-1">
                                <Label className="text-[10px] uppercase text-gray-400">{key.replace('_', ' ')}</Label>
                                <Input
                                    value={val}
                                    onChange={e => updateLabel(key, e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN - PREVIEW (STICKY/FIXED) */}
            <div className="hidden lg:flex flex-col h-full bg-gray-50 border-l">
                <div className="flex items-center justify-between p-3 border-b bg-white">
                    <div className="flex items-center gap-2 text-gray-600 font-semibold">
                        <Eye className="w-5 h-5" />
                        Live Preview
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Zoom:</span>
                        <input
                            type="range"
                            min="0.5"
                            max="1.0"
                            step="0.05"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="w-24"
                        />
                        <span className="text-xs text-gray-600 w-8">{Math.round(scale * 100)}%</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-100/50">
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            width: '640px', // Fixed width for the email simulator
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <div className="bg-white shadow-xl rounded-b-lg overflow-hidden">
                            <EmailPreview config={config} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
);
};

export default EmailTemplates;
