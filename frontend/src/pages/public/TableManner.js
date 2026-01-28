import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Utensils, Clock, Phone, GraduationCap, Award } from 'lucide-react';
import { Button } from '../../components/ui/button';
import axios from 'axios';
import { trackWhatsAppClick } from '../../utils/analytics';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const TableManner = () => {
    const [content, setContent] = useState({});

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await axios.get(`${API_URL}/content/table-manner`);
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

    // Default packages
    const defaultPackages = [
        {
            name: 'Basic Table Manner',
            pax: '20 - 30 pax',
            price: 'Rp 150.000/pax',
            includes: ['Materi Etika Makan', 'Praktek Langsung', 'Welcome Drink', 'Sertifikat'],
            image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'
        },
        {
            name: 'Premium Table Manner',
            pax: '20 - 50 pax',
            price: 'Rp 250.000/pax',
            includes: ['Materi Etika Makan', 'Praktek 3-Course Meal', 'Coffee Break', 'Lunch', 'Sertifikat', 'Dokumentasi'],
            image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800'
        },
        {
            name: 'Exclusive Table Manner',
            pax: '30 - 100 pax',
            price: 'Rp 350.000/pax',
            includes: ['Materi Lengkap', '5-Course Meal', 'Coffee Break', 'Wine Tasting Demo', 'Sertifikat', 'Dokumentasi', 'Souvenir'],
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
        }
    ];

    // Get packages from API or defaults
    const packages = [1, 2, 3].map((num, index) => {
        const apiPkg = content[`package${num}`];
        if (apiPkg && apiPkg.name) {
            return {
                name: apiPkg.name,
                pax: apiPkg.pax || defaultPackages[index].pax,
                price: apiPkg.price || defaultPackages[index].price,
                includes: apiPkg.includes ? apiPkg.includes.split('\n').map(i => i.trim()).filter(i => i) : defaultPackages[index].includes,
                image: apiPkg.image || defaultPackages[index].image
            };
        }
        return defaultPackages[index];
    });

    // Hero content
    const heroContent = content.hero || {};

    // Benefits
    const benefits = [
        { icon: GraduationCap, title: 'Instruktur Profesional', desc: 'Dibimbing oleh hospitality expert berpengalaman' },
        { icon: Utensils, title: 'Praktek Langsung', desc: 'Belajar dengan hidangan asli bukan simulasi' },
        { icon: Award, title: 'Sertifikat Resmi', desc: 'Sertifikat kelulusan untuk setiap peserta' },
        { icon: Users, title: 'Grup Fleksibel', desc: 'Cocok untuk sekolah, kampus, dan korporat' }
    ];

    // Handle Request Quote
    const handleRequestQuote = (pkgName) => {
        trackWhatsAppClick(`Table Manner Quote - ${pkgName}`);
        const message = `Hi, saya ingin bertanya tentang paket ${pkgName} untuk Table Manner.`;
        const url = `https://wa.me/6281130700206?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-emerald-50/30">
            {/* Hero */}
            <section className="relative h-[100svh] min-h-[600px] flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroContent.image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920'})` }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative text-center px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="text-emerald-300 uppercase tracking-widest text-sm mb-2">{heroContent.subtitle || 'Etiquette Training'}</p>
                        <h1 className="sr-only">Paket Table Manner Spencer Green Hotel Batu</h1>
                        <p className="font-display text-4xl sm:text-5xl text-white mb-4" role="heading" aria-level="2">
                            {heroContent.title || 'Paket Table Manner'}
                        </p>
                        <p className="text-emerald-100 max-w-2xl mx-auto text-lg">
                            {heroContent.description || 'Pelajari etika makan internasional dengan suasana hotel bintang yang nyaman'}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">Keunggulan</p>
                        <h2 className="font-display text-3xl font-medium text-gray-900">Mengapa Pilih Kami?</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center p-4"
                            >
                                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <benefit.icon className="w-7 h-7 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                                <p className="text-gray-500 text-sm">{benefit.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Packages */}
            <section className="py-20 bg-emerald-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="text-emerald-600 uppercase tracking-widest text-sm mb-2">Pilihan Paket</p>
                        <h2 className="font-display text-4xl font-medium text-gray-900">Paket Table Manner</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {packages.map((pkg, index) => (
                            <motion.div
                                key={pkg.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl overflow-hidden shadow-soft flex flex-col"
                                data-testid={`table-manner-package-${index}`}
                            >
                                <div className="aspect-[16/10] overflow-hidden">
                                    <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                                    <div className="flex items-center text-gray-500 mb-2">
                                        <Users className="w-4 h-4 mr-2" />
                                        <span className="text-sm">{pkg.pax}</span>
                                    </div>
                                    <p className="text-emerald-600 font-medium text-xl mb-4">{pkg.price}</p>
                                    <ul className="space-y-2 mb-6 flex-1">
                                        {pkg.includes.map((item, i) => (
                                            <li key={i} className="text-gray-600 text-sm flex items-start">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleRequestQuote(pkg.name)}
                                    >
                                        Tanya Paket Ini
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-20 bg-emerald-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="font-display text-3xl font-medium text-white mb-4">Siap Belajar Table Manner?</h2>
                    <p className="text-emerald-200 mb-8">
                        Hubungi tim kami untuk konsultasi dan penawaran khusus untuk grup Anda
                    </p>
                    <a
                        href="https://wa.me/6281130700206?text=Hi,%20saya%20ingin%20bertanya%20tentang%20paket%20Table%20Manner"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-white text-emerald-800 px-8 py-4 rounded-full font-semibold hover:bg-emerald-50 transition-colors"
                        onClick={() => trackWhatsAppClick('Table Manner Page CTA')}
                        data-testid="table-manner-contact-btn"
                    >
                        <Phone className="w-5 h-5 mr-2" />
                        Hubungi Kami
                    </a>
                </div>
            </section>
        </div>
    );
};

export default TableManner;
