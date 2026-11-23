/* ==========================================================
   game-config.js — pengaturan & data papan permainan
   Ubah di sini untuk memindahkan ular, tangga, petak bonus, dll.
   ========================================================== */

const GameConfig = {
  SIZE: 10, // papan 10 x 10
  TOTAL: 100, // petak terakhir
  MAX_LOG: 40, // jumlah baris log yang ditampilkan
  speed: 1, // pengali durasi animasi (1 = normal, kecil = lebih cepat)

  IMG: "assets/images/",

  /* Tangga: dari petak bawah (from) naik ke petak atas (to).
     ratio = lebar / tinggi asli gambar, dipakai agar proporsi gambar terjaga. */
  ladders: [
    { from: 4, to: 14, img: "ladders/ladder-brown.png", ratio: 0.33 },
    { from: 9, to: 31, img: "ladders/ladder-orange.png", ratio: 0.335 },
    { from: 21, to: 42, img: "ladders/ladder-wood.png", ratio: 0.28 },
    { from: 28, to: 84, img: "ladders/ladder-green.png", ratio: 0.096 },
    { from: 51, to: 67, img: "ladders/ladder-brown.png", ratio: 0.33 },
    { from: 80, to: 100, img: "ladders/ladder-orange.png", ratio: 0.335 },
  ],

  /* Ular: kepala di petak atas (from), ekor di petak bawah (to).
     flip = true untuk membalik gambar secara horizontal agar bervariasi. */
  snakes: [
    { from: 17, to: 7, img: "snakes/snake-green.png", ratio: 0.366, flip: false },
    { from: 54, to: 34, img: "snakes/snake-red.png", ratio: 0.72, flip: false },
    { from: 62, to: 19, img: "snakes/snake-tan.png", ratio: 0.363, flip: false },
    { from: 87, to: 24, img: "snakes/snake-blue.png", ratio: 0.315, flip: true },
    { from: 93, to: 73, img: "snakes/snake-green.png", ratio: 0.366, flip: true },
    { from: 97, to: 78, img: "snakes/snake-tan.png", ratio: 0.363, flip: true },
  ],

  /* Petak bonus (⭐) — injak untuk mengambil kartu. */
  bonusCells: [8, 33, 47, 58, 76, 90],

  /* Dek kartu bonus. weight = peluang relatif muncul. */
  cards: [
    { id: "again", icon: "🎲", title: "Lempar Lagi!", desc: "Kamu mendapat giliran tambahan.", weight: 35 },
    { id: "forward", icon: "🚀", title: "Roket Maju!", desc: "Maju 3 petak.", steps: 3, weight: 25 },
    { id: "shield", icon: "🛡️", title: "Perisai Anti-Ular", desc: "Kebal dari gigitan ular berikutnya.", weight: 25 },
    { id: "trap", icon: "🕳️", title: "Jebakan!", desc: "Mundur 2 petak.", steps: -2, weight: 15 },
  ],

  /* Warna bidak per pemain. */
  playerColors: ["#f7c948", "#ef4444", "#22c55e", "#a855f7"],

  /* Durasi animasi (ms, sebelum dikali speed). */
  timing: { dice: 70, step: 190, slide: 950, card: 1900, aiThink: 900, turnGap: 350 },
};
