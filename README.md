# Rak Kuliah

Halaman `index.html` menampilkan setiap folder mata kuliah sebagai rak buku,
dan setiap file `.html` di dalamnya sebagai buku (materi minggu).

## Struktur folder yang diharapkan

```
index.html
generate-sitemap.js
Kalkulus 1/
  first week.html
  second week.html
Struktur Data/
  pengantar array.html
  linked list.html
```

## Cara pakai

1. Taruh `index.html` dan `generate-sitemap.js` di folder utama (sejajar
   dengan semua folder mata kuliah).
2. Buka terminal di folder itu, jalankan:
   ```
   node generate-sitemap.js
   ```
3. Buka `index.html` (bisa langsung dobel klik, atau setelah di-push ke
   GitHub Pages).

Jalankan ulang `generate-sitemap.js` kapan pun ada folder/file baru yang
ditambahkan atau dihapus.

## Custom

- **Folder yang dilewati saat scan**: edit `EXCLUDE_DIRS` di bagian atas
  `generate-sitemap.js` (default: `node_modules`, `.git`, `.github`, `dist`,
  `build`, dan folder berawalan titik).
- **Judul buku**: diambil dari tag `<title>` file `.html` kalau ada, kalau
  tidak dari nama filenya.
- **Urutan buku**: otomatis mendeteksi angka dan kata urutan umum
  (first/second/..., pertama/kedua/...) supaya "Minggu 2" tampil sebelum
  "Minggu 10".
- **Warna punggung buku**: bergiliran dari palet HAPPY PRISM, bisa diedit
  di `BOOK_COLORS`.
- **Mode gelap/terang**: hanya ada di `index.html` ini (tombol di pojok
  kanan atas), tersimpan otomatis di browser.
