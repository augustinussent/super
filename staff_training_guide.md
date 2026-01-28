# Panduan Training Staff: Dashboard Admin Spencer Green Hotel

Dokumen ini adalah acuan standar operasional (SOP) untuk staf resepsionis dan manajer dalam menggunakan sistem website hotel.

---

## **Sesi 1: Pengenalan Dasar (Semua Staff)**

### **1. Cara Login**
*   **URL**: Buka `spencergreenhotel.com/login` (atau `/admin`)
*   **Akun**: Gunakan email & password yang sudah diberikan oleh IT.
*   **Penting**: Jangan bagikan password ke orang luar. Logout setelah shift selesai.

### **2. Menu Dashboard Utama**
*   **Kartu Statistik**: Cek cepat jumlah kamar terisi & tersedia hari ini.
*   **Grafik**: Melihat tren pengunjung website mingguan.
*   **Reservasi Terbaru**: Notifikasi booking yang baru masuk.

---

## **Sesi 2: Operasional Resepsionis (Front Office)**

Tugas utama: Memproses booking masuk dan mengatur ketersediaan kamar.

### **A. Menangani Booking Baru (Status: Pending)**
1.  Buka menu **Reservasi**.
2.  Filter status ke **Pending**.
3.  Cek apakah tamu sudah melakukan pembayaran (via transfer/bukti WA).
4.  Jika **Sudah Bayar**:
    *   Klik tombol **Mata** (Detail).
    *   Klik tombol **Confirmed**.
    *   Sistem akan mengirim email konfirmasi otomatis ke tamu.
5.  Jika **Belum Bayar / Ghost Booking** (setelah batas waktu):
    *   Klik tombol **Cancelled** agar kamar kembali tersedia untuk orang lain.

### **B. Proses Check-In & Check-Out**
1.  Saat tamu datang di hari H:
    *   Cari booking di menu **Reservasi** (ketik nama/kode booking).
    *   Pastikan status **Confirmed**.
    *   Ubah status menjadi **Checked In**.
2.  Saat tamu pulang:
    *   Ubah status menjadi **Checked Out**.
    *   Ini penting agar sistem tahu periode booking telah selesai.

### **C. Mengirim Ulang Email (Jika Tamu Minta)**
1.  Buka Detail Reservasi tamu tersebut.
2.  Scroll ke paling bawah.
3.  Klik tombol **"Kirim Ulang Email Konfirmasi"**.
4.  Pastikan muncul pesan "Email berhasil dikirim".

### **D. Menutup Kamar (Close Inventory)**
Jika ada kamar yang rusak atau dipakai internal:
1.  Buka menu **Kelola Kamar**.
2.  Pilih tipe kamar.
3.  Kurangi jumlah **Allotment** (Jatah Kamar) di tanggal tersebut, atau set menjadi 0.

---

## **Sesi 3: Operasional Manajer / Marketing**

Tugas utama: Mengatur harga, promo, dan konten website.

### **A. Membuat Kode Promo**
1.  Buka menu **Kode Promo**.
2.  Klik **Tambah Kode Promo**.
3.  Isi Kode (misal: `LIBURAN20`), Diskon (%), dan Tanggal Berlaku.
4.  Berikan kode ini ke tamu di Instagram/WhatsApp untuk menarik pesanan.

### **B. Membalas Review Tamu**
1.  Buka menu **Review**.
2.  Lihat review baru yang masuk.
3.  Klik **Approve** (Setujui) untuk menampilkannya di halaman depan website.
4.  (Opsional) Balas ulasan untuk meningkatkan interaksi.

### **C. Mengganti Banner & Kontak**
1.  Buka menu **Konten**.
2.  **Section Banner**: Ganti foto/kata-kata untuk promo musiman (Lebaran, Tahun Baru).
3.  **Section Kontak**: Jika nomor WA resepsionis ganti, update di sini agar tombol WA di website ikut berubah.

---

## **Sesi 4: Troubleshooting (Masalah Umum)**

| Masalah | Solusi |
| :--- | :--- |
| **Email tidak masuk ke tamu** | 1. Cek folder Spam tamu. <br> 2. Gunakan fitur "Kirim Ulang Email" di detail reservasi. |
| **Data Dashboard kosong** | Coba refresh halaman. Pastikan internet lancar. |
| **Lupa Password** | Gunakan fitur "Forgot Password" di halaman login, cek email untuk reset. |
| **Tampilan Website berantakan** | Tekan `Ctrl + Shift + R` (Hard Reload) di browser untuk membersihkan cache lama. |

---

*Catatan: Pastikan staf baru didampingi staf senior saat mencoba sistem untuk pertama kali (hands-on training).*
