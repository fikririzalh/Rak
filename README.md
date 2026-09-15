# Rak Kuliah

Halaman `index.html` punya dua section (bisa ganti lewat tombol tab):

- **📚 Rak Terorganisir** — tiap folder mata kuliah jadi satu rak buku,
  tiap file `.html` di dalamnya jadi satu buku (materi minggu).
- **📦 Materi Original** — file mentah (PDF, gambar, dokumen, dll) yang
  belum diolah jadi materi mingguan, dikelompokkan per mata kuliah juga,
  tapi ditampilkan sebagai kartu file, bukan rak buku.

## Struktur folder yang diharapkan

```
index.html
generate-sitemap.js
Kalkulus 1/                   <- sudah diolah -> Rak Terorganisir
  first week.html
  second week.html
Struktur Data/
  pengantar array.html
Materi/                       <- materi original, dikecualikan dari Rak Terorganisir
  Kalkulus 1/
    Slide Pengantar Limit.pdf
    Foto Papan Tulis.jpg
  Struktur Data/
    Rekaman Kelas.mp4
```

Nama folder di dalam `Materi/` tidak harus sama persis dengan folder mata
kuliah di Rak Terorganisir — dua-duanya di-scan independen.

## Cara pakai

1. Taruh `index.html` dan `generate-sitemap.js` di folder utama (sejajar
   dengan semua folder mata kuliah dan folder `Materi/`).
2. Buka terminal di folder itu, jalankan:
   ```
   node generate-sitemap.js
   ```
3. Buka `index.html` (bisa langsung dobel klik, atau setelah di-push ke
   GitHub Pages).

Jalankan ulang `generate-sitemap.js` kapan pun ada folder/file baru yang
ditambahkan atau dihapus. Perhatian: script ini menulis ulang datanya
dari nol setiap dijalankan, jadi kalau kamu edit array `SHELVES` atau
`ORIGINAL_MATERIALS` secara manual di `index.html`, editan itu akan
tertimpa saat script dijalankan lagi.

## Custom

- **Folder yang dilewati saat scan Rak Terorganisir**: edit `EXCLUDE_DIRS`
  di bagian atas `generate-sitemap.js` (default: `node_modules`, `.git`,
  `.github`, `dist`, `build`, dan `Materi` itu sendiri).
- **Judul buku**: diambil dari tag `<title>` file `.html` kalau ada, kalau
  tidak dari nama filenya.
- **Urutan buku/file**: otomatis mendeteksi angka dan kata urutan umum
  (first/second/..., pertama/kedua/...) supaya "Minggu 2" tampil sebelum
  "Minggu 10".
- **Warna punggung buku**: bergiliran dari palet HAPPY PRISM, bisa diedit
  di `BOOK_COLORS`.
- **Ikon file materi original**: dipetakan dari ekstensi file di
  `ICON_MAP` dalam `index.html` (bisa tambah jenis file baru di situ).
- **Mode gelap/terang**: hanya ada di `index.html` ini (tombol di pojok
  kanan atas), tersimpan otomatis di browser.

