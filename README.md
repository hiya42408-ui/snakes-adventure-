# Snakes Adventure 🐍🪜

Gim ular tangga berbasis web — Project 4 Individu, X-RPL 2 (Bhekti Febriyanto).
Dibuat dengan HTML, CSS, dan JavaScript murni (tanpa framework, tanpa server).

## Cara menjalankan
Buka `index.html` di browser (Chrome/Edge/Firefox). Untuk publikasi, unggah seluruh folder
ke GitHub lalu aktifkan **GitHub Pages** (atau deploy ke Vercel).

## Struktur folder
```
snakes-adventure/
├── index.html        → Home
├── register.html     → Register
├── login.html        → Login
├── dashboard.html    → Dashboard
├── game.html         → Halaman Game
├── css/
│   ├── base.css        (gaya dasar bersama: warna, tombol, form, modal)
│   ├── home.css        (khusus Home)
│   ├── auth.css        (kerangka layout Register & Login)
│   ├── register.css    (khusus Register)
│   ├── login.css       (khusus Login)
│   ├── dashboard.css   (khusus Dashboard)
│   └── game.css        (khusus Game)
├── js/
│   ├── storage.js      (Local Storage: akun, sesi, riwayat, simpanan game)
│   ├── ui.js           (toast, dialog konfirmasi, flash message)
│   ├── auth.js         (register, login, logout, penjaga halaman)
│   ├── home.js         (khusus Home)
│   ├── register.js     (khusus Register)
│   ├── login.js        (khusus Login)
│   ├── dashboard.js    (khusus Dashboard)
│   ├── game-config.js  (posisi ular, tangga, petak bonus, kartu)
│   ├── game-sound.js   (efek suara)
│   ├── game-board.js   (menggambar papan, ular/tangga, bidak)
│   └── game.js         (logika permainan)
└── assets/images/
    ├── logo.png, favicon.png
    ├── snakes/   (snake-green, snake-tan, snake-red, snake-blue)
    ├── ladders/  (ladder-orange, ladder-brown, ladder-green, ladder-wood)
    └── dice/     (dice-1 … dice-6)
```

## Fitur
- Register (validasi + cek username), Login, Logout (akun & data tidak dihapus)
- Dashboard: username, statistik, high score, riwayat, papan peringkat, reset data
- Game: papan 100 petak zig-zag, dadu animasi, ular & tangga bergambar
- Mode: **1 Player vs AI** dan **Multiplayer Lokal (2–4 pemain)**
- Kartu bonus ⭐: lempar lagi, maju 3, perisai anti-ular, jebakan mundur 2
- Aturan: angka 6 = lempar lagi; harus tepat di petak 100 (kelebihan → memantul mundur)
- Permainan otomatis tersimpan dan bisa dilanjutkan (Local Storage)

## Mengubah isi papan
Edit `js/game-config.js` untuk memindahkan ular/tangga, petak bonus, kartu, warna bidak,
atau kecepatan animasi.
