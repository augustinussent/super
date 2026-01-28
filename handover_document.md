# Dokumen Serah Terima Website Spencer Green Hotel (spencergreenhotel.com)

Dokumen ini berisi rincian teknis dan fungsional website untuk keperluan presentasi dan serah terima kepada manajemen hotel.

## 1. Ringkasan Sistem
Website ini adalah **Sistem Manajemen Hotel Terintegrasi** yang menggabungkan portal pemesanan tamu (Public Facing) dengan dashboard administrasi (Admin Panel) untuk mengelola operasional hotel secara digital.

*   **URL Publik**: `https://spencergreenhotel.com`
*   **URL Admin**: `https://spencergreenhotel.com/admin` (atau `/login`)
*   **Status**: Live / Production

---

## 2. Fitur Utama

### A. Halaman Publik (Tamu)
1.  **Informasi Lengkap**: Beranda, Kamar, Meeting, Wedding, Fasilitas, dan Galeri.
2.  **Sistem Reservasi Online**: Tamu dapat mengecek ketersediaan kamar secara real-time.
3.  **Booking Engine**: Alur pemesanan yang mudah dengan konfirmasi otomatis via email.
4.  **Integrasi WhatsApp**: Tombol chat langsung untuk pertanyaan cepat atau konfirmasi pembayaran.
5.  **Responsive Design**: Tampilan yang optimal di Desktop, Tablet, dan Smartphone.

### B. Dashboard Admin (Manajemen)
1.  **Dashboard Analytics**:
    *   Grafik pendapatan bulanan & traffic pengunjung.
    *   Statistik okupansi kamar hari ini.
    *   Monitoring reservasi terbaru.
2.  **Manajemen Reservasi**:
    *   Lihat daftar semua booking (Pending, Confirmed, Checked In, Checked Out).
    *   Update status reservasi.
    *   **Fitur Kirim Ulang Email Konfirmasi** (jika tamu kehilangan email).
    *   Filter pencarian berdasarkan nama, kode booking, atau tanggal.
3.  **Kelola Kamar & Inventori**:
    *   Atur tipe kamar, harga dasar, dan fasilitas.
    *   Upload foto kamar.
    *   Manajemen alokasi (allotment) harian.
4.  **Kode Promo**: Membuat voucher diskon untuk marketing.
5.  **Manajemen Konten (CMS)**:
    *   Mengubah banner promo di halaman depan.
    *   Mengupdate kontak (No WA, Email) tanpa coding.
6.  **Sistem Review**: Moderasi ulasan dari tamu sebelum tampil di website.

---

## 3. Spesifikasi Teknis (Tech Stack)

Website dibangun menggunakan teknologi modern yang cepat, aman, dan mudah dikembangkan (scalable).

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | React.js (Node.js) | Antarmuka pengguna yang interaktif dan cepat. |
| **Backend** | Python (FastAPI) | Server berkinerja tinggi untuk memproses data. |
| **Database** | MongoDB Atlas | Penyimpanan data yang fleksibel dan berbasis Cloud. |
| **Styling** | Tailwind CSS | Desain modern dan konsisten. |
| **Email** | SMTP (Exim/cPanel) | Server email khusus domain hotel (`reservasi@...`). |
| **Media** | Cloudinary / Local | Penyimpanan gambar yang teroptimasi. |
| **Hosting** | Render / Vercel | Infrastruktur server yang stabil. |

---

## 4. Keamanan & Infrastruktur
1.  **SSL/TLS (HTTPS)**: Komunikasi data terenkripsi (gembok hijau), aman untuk transaksi.
2.  **Admin Authentication**: Login aman menggunakan JWT (JSON Web Token).
3.  **Role-Based Access**: Sistem admin terlindungi, hanya user terdaftar yang bisa masuk.
4.  **Audit Logs**: Mencatat aktivitas admin (siapa mengubah apa) untuk transparansi.
5.  **CORS Policy**: Proteksi agar API hanya bisa diakses oleh website resmi.

---

## 5. Panduan Operasional Singkat

### Mengakses Dashboard
1.  Buka `spencergreenhotel.com/login`
2.  Masukkan Email & Password Admin.

### Menangani Reservasi Baru
1.  Buka menu **Reservasi**.
2.  Cek status "Pending".
3.  Jika pembayaran diterima (via Transfer/WA), klik ikon **Mata** -> Ubah status jadi **Confirmed**.
4.  Sistem otomatis mengirim email konfirmasi (atau bisa dikirim ulang manual).

### Mengubah Banner Promo
1.  Buka menu **Konten**.
2.  Pilih bagian "Promo Banner".
3.  Upload gambar baru atau ganti teks promo.
4.  Klik Simpan. Website otomatis terupdate.

---

## 6. Kontak Support & Maintenance
Jika terjadi kendala teknis (seperti email tidak terkirim atau website tidak bisa dibuka), hubungi tim IT support dengan menyertakan screenshot error.

*Update Terakhir: 28 Januari 2026 (Fitur Analytics & Email Resend telah aktif)*
