/* ==========================================================
   game-board.js — menggambar papan 100 petak zig-zag,
   gambar ular & tangga (SVG), dan bidak pemain.
   Semua koordinat memakai satuan persen (0–100) dari papan.
   ========================================================== */

const Board = (() => {
  const { SIZE, TOTAL } = GameConfig;
  const SVG_NS = "http://www.w3.org/2000/svg";

  let cellsEl, spritesEl, piecesEl;
  let pieceEls = [];

  /* ---------- Koordinat ---------- */
  /* Petak 1 di kiri-bawah; baris genap ke kanan, baris ganjil ke kiri (zig-zag). */
  function cellToGrid(n) {
    const index = n - 1;
    const row = Math.floor(index / SIZE); // 0 = baris paling bawah
    const colInRow = index % SIZE;
    const col = row % 2 === 0 ? colInRow : SIZE - 1 - colInRow;
    return { row, col };
  }

  /* Titik tengah petak (persen). */
  function cellCenter(n) {
    const { row, col } = cellToGrid(n);
    const unit = 100 / SIZE;
    return { x: (col + 0.5) * unit, y: (SIZE - 1 - row + 0.5) * unit };
  }

  /* ---------- Membangun papan ---------- */
  function build() {
    cellsEl = document.getElementById("cells");
    spritesEl = document.getElementById("sprites");
    piecesEl = document.getElementById("pieces");

    buildCells();
    buildSprites();
  }

  function buildCells() {
    const bonus = new Set(GameConfig.bonusCells);
    const html = [];

    // Baris tampil dari atas ke bawah → mulai dari baris ke-9
    for (let row = SIZE - 1; row >= 0; row--) {
      for (let col = 0; col < SIZE; col++) {
        const n = row % 2 === 0 ? row * SIZE + col + 1 : row * SIZE + (SIZE - col);
        const classes = ["cell", `tone-${n % 4}`];
        let mark = "";
        if (n === TOTAL) {
          classes.push("is-finish");
          mark = '<span class="mark">👑</span>';
        } else if (bonus.has(n)) {
          classes.push("is-bonus");
          mark = '<span class="mark">⭐</span>';
        }
        html.push(`<div class="${classes.join(" ")}" data-n="${n}"><span class="num">${n}</span>${mark}</div>`);
      }
    }
    cellsEl.innerHTML = html.join("");
  }

  /* Satu gambar (ular/tangga) diregangkan dari titik atas ke titik bawah. */
  function addSprite({ topCell, bottomCell, img, ratio, flip, kind }) {
    const top = cellCenter(topCell);
    const bottom = cellCenter(bottomCell);
    const dx = bottom.x - top.x;
    const dy = bottom.y - top.y;
    const length = Math.hypot(dx, dy);

    const [minW, maxW] = kind === "snake" ? [8, 12] : [3.4, 6.6];
    const width = Math.min(maxW, Math.max(minW, length * ratio));
    const height = length + (kind === "snake" ? 4 : 5); // sedikit lebih panjang agar ujung menutupi pusat petak

    // Gambar asli menghadap vertikal (atas → bawah). Putar agar sejajar garis.
    const angle = (Math.atan2(-dx, dy) * 180) / Math.PI;
    const cx = (top.x + bottom.x) / 2;
    const cy = (top.y + bottom.y) / 2;

    const image = document.createElementNS(SVG_NS, "image");
    image.setAttribute("href", GameConfig.IMG + img);
    image.setAttribute("x", -width / 2);
    image.setAttribute("y", -height / 2);
    image.setAttribute("width", width);
    image.setAttribute("height", height);
    image.setAttribute("preserveAspectRatio", "none");
    image.setAttribute("transform", `translate(${cx} ${cy}) rotate(${angle}) ${flip ? "scale(-1 1)" : ""}`);
    image.setAttribute("class", `sprite sprite--${kind}`);
    spritesEl.appendChild(image);
  }

  function buildSprites() {
    spritesEl.innerHTML = "";
    // Tangga digambar dulu agar ular tampil di atasnya
    GameConfig.ladders.forEach((l) =>
      addSprite({ topCell: l.to, bottomCell: l.from, img: l.img, ratio: l.ratio, flip: false, kind: "ladder" })
    );
    GameConfig.snakes.forEach((s) =>
      addSprite({ topCell: s.from, bottomCell: s.to, img: s.img, ratio: s.ratio, flip: s.flip, kind: "snake" })
    );
  }

  /* ---------- Bidak ---------- */
  function createPieces(players) {
    piecesEl.innerHTML = "";
    pieceEls = players.map((p, i) => {
      const el = document.createElement("div");
      el.className = "piece";
      el.style.setProperty("--c", p.color);
      el.dataset.index = i;
      el.title = p.name;
      el.textContent = p.ai ? "🤖" : p.name.trim().charAt(0).toUpperCase();
      piecesEl.appendChild(el);
      return el;
    });
    layout(players);
  }

  /* Posisikan semua bidak. Bidak yang sepetak dibagi posisinya agar tidak bertumpuk. */
  function layout(players, activeIndex = -1) {
    const groups = {};
    players.forEach((p, i) => {
      if (p.pos > 0) (groups[p.pos] = groups[p.pos] || []).push(i);
    });

    players.forEach((p, i) => {
      const el = pieceEls[i];
      if (!el) return;
      let x;
      let y;

      if (p.pos === 0) {
        // Area START di bawah papan
        x = 6 + i * 6.5;
        y = 104.6;
      } else {
        const center = cellCenter(p.pos);
        const group = groups[p.pos];
        const offset = slotOffset(group.indexOf(i), group.length);
        x = center.x + offset.x;
        y = center.y + offset.y;
      }
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.classList.toggle("is-active", i === activeIndex);
      el.classList.toggle("has-shield", Boolean(p.shield));
    });
  }

  function slotOffset(slot, total) {
    if (total <= 1) return { x: 0, y: 0 };
    const patterns = {
      2: [[-2, 0], [2, 0]],
      3: [[-2.1, -1.6], [2.1, -1.6], [0, 2.1]],
      4: [[-2.1, -2.1], [2.1, -2.1], [-2.1, 2.1], [2.1, 2.1]],
    };
    const [x, y] = patterns[Math.min(total, 4)][slot % 4];
    return { x, y };
  }

  /* Mode luncur (animasi lambat saat naik tangga / digigit ular). */
  function setSliding(index, on) {
    if (pieceEls[index]) pieceEls[index].classList.toggle("is-sliding", on);
  }

  /* Efek kilau pada bidak (dipakai saat mendarat). */
  function pulse(index) {
    const el = pieceEls[index];
    if (!el) return;
    el.classList.remove("is-pulse");
    void el.offsetWidth;
    el.classList.add("is-pulse");
  }

  return { build, createPieces, layout, setSliding, pulse, cellCenter };
})();
