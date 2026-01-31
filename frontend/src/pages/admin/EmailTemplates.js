import { useState, useEffect } from 'react';
import { Save, Mail, FileText, DollarSign, Layout, List } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const EmailTemplates = () => {
    const { getToken, hasPermission } = useAuth();
    const [loading, setLoading] = useState(false);

    // Default config matching backend
    const [config, setConfig] = useState({
        subject_template: "Konfirmasi Reservasi - {booking_code}",
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
            // toast.error('Gagal mengambil konfigurasi email');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!hasPermission('content')) {
            toast.error('Anda tidak memiliki izin untuk menyimpan konten.');
            return;
        }

        try {
            setLoading(true);
            const token = await getToken();
            // We use the existing Generic Content API
            // Page: email, Section: reservation_conf
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

    // Helper for List editing (Notes & Policy)
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Mail className="w-6 h-6" />
                    Template Email Reservasi
                </h1>
                <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6 lg:col-span-2">
                    <h2 className="font-semibold flex items-center gap-2 text-emerald-800">
                        <List className="w-5 h-5" />
                        Daftar & Kebijakan
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                        <div className="space-y-3">
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
                </div>

                {/* Translation / Labels */}
                <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4 lg:col-span-2">
                    <h2 className="font-semibold flex items-center gap-2 text-emerald-800">
                        <FileText className="w-5 h-5" />
                        Label & Terjemahan
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">Ubah label teks yang muncul di email.</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(config.labels).map(([key, val]) => (
                            <div key={key} className="space-y-1">
                                <Label className="text-xs uppercase text-gray-400">{key.replace('_', ' ')}</Label>
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
        </div>
    );
};

export default EmailTemplates;
