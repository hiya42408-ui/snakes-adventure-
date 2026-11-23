/* ==========================================================
   game.js — logika permainan Snakes Adventure
   - Pemilihan mode (1 Player vs AI / Multiplayer Lokal 2–4)
   - Giliran, dadu, gerak bidak, ular, tangga, kartu bonus
   - Kondisi menang, skor, simpan riwayat & lanjutkan permainan
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const user = Auth.requireLogin(); // wajib login
  if (!user) return;

  const { TOTAL, timing } = GameConfig;

  /* ---------- Peta cepat: petak → ular / tangga ---------- */
  const LADDER_AT = {};
  const SNAKE_AT = {};
  GameConfig.ladders.forEach((l) => (LADDER_AT[l.from] = l));
  GameConfig.snakes.forEach((s) => (SNAKE_AT[s.from] = s));
  const BONUS_CELLS = new Set(GameConfig.bonusCells);

  /* ---------- Elemen DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const el = {
    setup: $("setup"),
    localOptions: $("localOptions"),
    countSeg: $("countSeg"),
    nameFields: $("nameFields"),
    setupNote: $("setupNote"),
    startBtn: $("startBtn"),
    resumeBtn: $("resumeBtn"),
    rollBtn: $("rollBtn"),
    dice: $("dice"),
    diceImg: $("diceImg"),
    turnName: $("turnName"),
    turnDot: $("turnDot"),
    playerList: $("playerList"),
    log: $("log"),
    restartBtn: $("restartBtn"),
    menuBtn: $("menuBtn"),
    soundBtn: $("soundBtn"),
    cardPopup: $("cardPopup"),
  };

  $("navUsername").textContent = user.username;

  /* ---------- State ---------- */
  let state = null; // data permainan yang sedang berjalan
  let busy = false; // true selama animasi berlangsung
  let runId = 0; // berubah setiap permainan baru → membatalkan timer lama
  let setup = { mode: "ai", count: 2 };

  /* ---------- Util ---------- */
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms * GameConfig.speed));
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const current = () => state.players[state.current];
  const diceSrc = (n) => `${GameConfig.IMG}dice/dice-${n}.png`;

  // Muat awal gambar dadu agar animasi tidak berkedip
  for (let i = 1; i <= 6; i++) new Image().src = diceSrc(i);

  /* ==========================================================
     1. PEMILIHAN MODE
     ========================================================== */
  function openSetup() {
    state = null;
    busy = false;
    runId++;
    el.setup.classList.remove("hidden");
    el.rollBtn.disabled = true;
    el.resumeBtn.classList.toggle("hidden", !Store.getSavedGame(user.username));
    renderNameFields();
    updateSetupNote();
  }

  function renderNameFields() {
    const isLocal = setup.mode === "local";
    el.localOptions.classList.toggle("hidden", !isLocal);
    if (!isLocal) return;

    // Pertahankan isian yang sudah diketik
    const old = Array.from(el.nameFields.querySelectorAll("input")).map((i) => i.value);
    let html = "";
    for (let i = 0; i < setup.count; i++) {
      const locked = i === 0;
      const value = locked ? user.username : old[i] || "";
      html += `
        <div class="field">
          <label for="name${i}">Pemain ${i + 1}${locked ? " (kamu)" : ""}</label>
          <input class="input" id="name${i}" type="text" maxlength="12"
                 value="${Ui.escapeHtml(value)}" placeholder="Pemain ${i + 1}" ${locked ? "readonly" : ""} />
        </div>`;
    }
    el.nameFields.innerHTML = html;
  }

  function updateSetupNote() {
    const hasSaved = Boolean(Store.getSavedGame(user.username));
    el.setupNote.textContent =
      (setup.mode === "ai"
        ? `Kamu (${user.username}) melawan Komputer. `
        : "Statistik tercatat untuk akunmu sebagai Pemain 1. ") +
      (hasSaved ? "Memulai permainan baru akan menimpa permainan tersimpan." : "");
  }

  document.querySelectorAll('input[name="mode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      setup.mode = radio.value;
      renderNameFields();
      updateSetupNote();
    });
  });

  el.countSeg.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-count]");
    if (!btn) return;
    setup.count = Number(btn.dataset.count);
    el.countSeg.querySelectorAll(".seg__btn").forEach((b) => b.classList.toggle("is-on", b === btn));
    renderNameFields();
  });

  el.startBtn.addEventListener("click", () => {
    Sound.play("bonus"); // sekaligus mengaktifkan audio (butuh interaksi pengguna)
    const players = [];

    if (setup.mode === "ai") {
      players.push({ name: user.username, ai: false }, { name: "Komputer", ai: true });
    } else {
      for (let i = 0; i < setup.count; i++) {
        const input = $(`name${i}`);
        const name = (input ? input.value.trim() : "") || `Pemain ${i + 1}`;
        players.push({ name: i === 0 ? user.username : name, ai: false });
      }
    }
    startGame(setup.mode, players);
  });

  el.resumeBtn.addEventListener("click", () => {
    const saved = Store.getSavedGame(user.username);
    if (saved) resumeGame(saved);
  });

  /* ==========================================================
     2. MEMULAI / MELANJUTKAN PERMAINAN
     ========================================================== */
  function startGame(mode, players) {
    runId++;
    state = {
      mode,
      modeLabel: mode === "ai" ? "1 Player vs AI" : `Multiplayer Lokal (${players.length})`,
      players: players.map((p, i) => ({
        name: p.name,
        ai: p.ai,
        color: GameConfig.playerColors[i],
        pos: 0,
        shield: false,
        rolls: 0,
      })),
      current: 0,
      over: false,
      log: [],
    };
    el.log.innerHTML = "";
    boot();
    addLog(state.players[0], "memulai permainan. Semoga beruntung!");
    afterTurn(true); // mulai dari pemain pertama (extra = true → tidak ganti giliran)
  }

  function resumeGame(saved) {
    runId++;
    state = JSON.parse(JSON.stringify(saved));
    el.log.innerHTML = "";
    boot();
    (state.log || []).slice().reverse().forEach((entry) => renderLog(entry.c, entry.t));
    addLog(current(), "melanjutkan permainan tersimpan.");
    afterTurn(true);
  }

  /* Siapkan tampilan untuk permainan yang baru dimulai / dilanjutkan. */
  function boot() {
    el.setup.classList.add("hidden");
    document.querySelectorAll(".confetti, .winner-backdrop").forEach((n) => n.remove());
    el.dice.classList.remove("is-rolling");
    Board.createPieces(state.players);
    renderPlayers();
  }

  /* ==========================================================
     3. DADU
     ========================================================== */
  async function rollDice() {
    Sound.play("roll");
    el.dice.classList.add("is-rolling");
    const final = randInt(1, 6);
    for (let i = 0; i < 9; i++) {
      el.diceImg.src = diceSrc(randInt(1, 6));
      await wait(timing.dice);
    }
    el.diceImg.src = diceSrc(final);
    el.dice.classList.remove("is-rolling");
    return final;
  }

  /* ==========================================================
     4. GERAK BIDAK
     ========================================================== */
  function refreshBoard() {
    Board.layout(state.players, state.current);
    renderPlayers();
  }

  /* Berjalan satu petak demi satu petak menuju target. */
  async function stepTo(player, target) {
    const dir = target > player.pos ? 1 : -1;
    while (player.pos !== target) {
      player.pos += dir;
      refreshBoard();
      Sound.play("step");
      await wait(timing.step);
    }
  }

  /* Lempar dadu → maju. Jika melebihi 100, bidak memantul mundur. */
  async function moveBy(player, roll) {
    const raw = player.pos + roll;
    if (raw <= TOTAL) {
      await stepTo(player, raw);
      return;
    }
    await stepTo(player, TOTAL);
    const final = 2 * TOTAL - raw;
    addLog(player, `kelebihan ${raw - TOTAL} petak, bidak memantul mundur ke ${final}.`);
    await wait(timing.turnGap);
    await stepTo(player, final);
  }

  /* Meluncur langsung (ular / tangga). */
  async function slideTo(player, target, sound) {
    const index = state.players.indexOf(player);
    Sound.play(sound);
    Board.setSliding(index, true);
    player.pos = target;
    refreshBoard();
    await wait(timing.slide);
    Board.setSliding(index, false);
    Board.pulse(index);
  }

  /* ==========================================================
     5. EFEK PETAK: tangga, ular, bonus
     ========================================================== */
  function drawCard() {
    const total = GameConfig.cards.reduce((sum, c) => sum + c.weight, 0);
    let roll = Math.random() * total;
    for (const card of GameConfig.cards) {
      roll -= card.weight;
      if (roll <= 0) return card;
    }
    return GameConfig.cards[0];
  }

  async function showCard(card) {
    el.cardPopup.innerHTML = `<span class="icon">${card.icon}</span><strong>${card.title}</strong><span class="desc">${card.desc}</span>`;
    el.cardPopup.classList.remove("hidden");
    await wait(timing.card);
    el.cardPopup.classList.add("hidden");
  }

  /* Mengembalikan { extra } → true bila pemain berhak melempar lagi. */
  async function resolveTile(player, fromCard = false) {
    const result = { extra: false };

    const ladder = LADDER_AT[player.pos];
    const snake = SNAKE_AT[player.pos];

    if (ladder) {
      addLog(player, `🪜 naik tangga dari ${ladder.from} ke ${ladder.to}!`);
      await slideTo(player, ladder.to, "ladder");
    } else if (snake) {
      if (player.shield) {
        player.shield = false;
        addLog(player, `🛡️ perisainya melindungi dari ular di petak ${snake.from}!`);
        Sound.play("shield");
        refreshBoard();
        await wait(timing.turnGap * 2);
      } else {
        addLog(player, `🐍 digigit ular di petak ${snake.from}, turun ke ${snake.to}.`);
        await slideTo(player, snake.to, "snake");
      }
    } else if (!fromCard && BONUS_CELLS.has(player.pos)) {
      const card = drawCard();
      addLog(player, `⭐ mengambil kartu: ${card.title}`);
      Sound.play("bonus");
      await showCard(card);

      if (card.id === "again") {
        result.extra = true;
      } else if (card.id === "shield") {
        player.shield = true;
        refreshBoard();
      } else if (card.steps) {
        const target = Math.min(TOTAL, Math.max(1, player.pos + card.steps));
        if (target !== player.pos) {
          await stepTo(player, target);
          const chained = await resolveTile(player, true); // bisa mendarat di ular / tangga
          result.extra = chained.extra;
        }
      }
    }
    return result;
  }

  /* ==========================================================
     6. ALUR SATU GILIRAN
     ========================================================== */
  async function playTurn() {
    if (busy || !state || state.over) return;
    const myRun = runId;
    busy = true;
    updateControls();

    const player = current();
    const roll = await rollDice();
    player.rolls++;
    addLog(player, `melempar dadu: ${roll}`);

    await moveBy(player, roll);
    const effect = await resolveTile(player);

    if (myRun !== runId) return; // permainan di-reset saat animasi

    // Menang?
    if (player.pos === TOTAL) {
      finishGame(state.current);
      return;
    }

    let extra = effect.extra;
    if (roll === 6) {
      addLog(player, "🎉 dapat angka 6, lempar sekali lagi!");
      extra = true;
    }
    await wait(timing.turnGap);
    if (myRun !== runId) return;
    afterTurn(extra);
  }

  /* Ganti giliran (kecuali dapat giliran tambahan), simpan, lalu jalankan AI bila perlu. */
  function afterTurn(extra) {
    if (!extra) state.current = (state.current + 1) % state.players.length;
    busy = false;
    persist();
    refreshBoard();
    updateControls();

    if (current().ai) {
      const myRun = runId;
      setTimeout(() => {
        if (myRun === runId && state && !state.over && !busy && current().ai) playTurn();
      }, timing.aiThink * GameConfig.speed);
    }
  }

  /* ==========================================================
     7. SELESAI
     ========================================================== */
  function finishGame(winnerIndex) {
    state.over = true;
    busy = false;
    Store.clearSavedGame(user.username);

    const winner = state.players[winnerIndex];
    const me = state.players[0]; // pemain 1 = akun yang login
    const won = winnerIndex === 0;
    const score = Store.calcScore(won, me.rolls);

    Store.addGame({
      user: user.username,
      date: new Date().toISOString(),
      mode: state.mode,
      modeLabel: state.modeLabel,
      players: state.players.map((p) => p.name),
      winner: winner.name,
      won,
      rolls: me.rolls,
      score,
    });

    addLog(winner, "🏆 mencapai petak 100 dan memenangkan permainan!");
    refreshBoard();
    updateControls();
    Sound.play("win");
    showWinner(winner, me, won, score);
  }

  function showWinner(winner, me, won, score) {
    const rows = state.players
      .map((p) => `<li>${Ui.escapeHtml(p.name)}: <strong>${p.rolls}</strong> lemparan</li>`)
      .join("");

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop winner-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.innerHTML = `
      <div class="modal card winner">
        <div class="winner__crown">👑</div>
        <h2>${Ui.escapeHtml(winner.name)} Menang!</h2>
        <p class="text-muted">${won ? "Selamat, kamu berhasil mencapai petak 100!" : `${Ui.escapeHtml(me.name)} belum beruntung kali ini.`}</p>
        <ul class="winner__stats">
          ${rows}
          <li>Skor untuk ${Ui.escapeHtml(user.username)}: <strong>+${score}</strong></li>
        </ul>
        <div class="modal__actions">
          <a class="btn btn--ghost" href="dashboard.html">Dashboard</a>
          <button class="btn btn--gold" id="againBtn" type="button">Main Lagi</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector("#againBtn").addEventListener("click", () => {
      backdrop.remove();
      restart();
    });
    if (won) launchConfetti();
  }

  function launchConfetti() {
    const colors = ["#f7c948", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#fff"];
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = `${2.2 + Math.random() * 2.2}s`;
      piece.style.animationDelay = `${Math.random() * 0.8}s`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 6000);
    }
  }

  function restart() {
    const players = state.players.map((p) => ({ name: p.name, ai: p.ai }));
    startGame(state.mode, players);
  }

  /* ==========================================================
     8. TAMPILAN: pemain, kontrol, log
     ========================================================== */
  function renderPlayers() {
    el.playerList.innerHTML = state.players
      .map((p, i) => {
        const initial = p.ai ? "🤖" : Ui.escapeHtml(p.name.trim().charAt(0).toUpperCase());
        const label = p.ai ? "Komputer" : i === 0 ? "Akunmu" : "Pemain";
        return `
          <li class="player ${i === state.current && !state.over ? "is-current" : ""}" style="--c:${p.color}">
            <span class="player__token">${initial}</span>
            <span class="player__name">${Ui.escapeHtml(p.name)}<small>${label}${p.shield ? " · 🛡️ perisai" : ""}</small></span>
            <span class="player__pos">${p.pos === 0 ? "Start" : p.pos}</span>
          </li>`;
      })
      .join("");
  }

  function updateControls() {
    if (!state) return;
    const p = current();
    el.turnName.textContent = state.over ? `${p.name} menang!` : p.ai ? `${p.name} (berpikir…)` : p.name;
    el.turnDot.style.setProperty("--dot", p.color);
    const humanTurn = !p.ai && !busy && !state.over;
    el.rollBtn.disabled = !humanTurn;
    el.restartBtn.disabled = busy;
    el.menuBtn.disabled = busy;
  }

  function renderLog(color, text) {
    const li = document.createElement("li");
    li.style.setProperty("--c", color);
    li.innerHTML = `<span class="dot"></span><span>${Ui.escapeHtml(text)}</span>`;
    el.log.prepend(li);
    while (el.log.children.length > GameConfig.MAX_LOG) el.log.lastChild.remove();
  }

  function addLog(player, message) {
    const text = `${player.name} ${message}`;
    renderLog(player.color, text);
    state.log = [{ c: player.color, t: text }, ...(state.log || [])].slice(0, 20);
  }

  /* ---------- Simpan permainan (data permainan di Local Storage) ---------- */
  function persist() {
    if (state && !state.over) Store.setSavedGame(user.username, state);
  }

  /* ==========================================================
     9. TOMBOL & KEYBOARD
     ========================================================== */
  el.rollBtn.addEventListener("click", playTurn);

  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (["INPUT", "BUTTON", "A", "SELECT"].includes(tag)) return;
    if (!el.setup.classList.contains("hidden")) return;
    e.preventDefault();
    if (!el.rollBtn.disabled) playTurn();
  });

  el.restartBtn.addEventListener("click", async () => {
    if (busy || !state) return;
    const ok = await Ui.confirmDialog({
      title: "Ulangi permainan?",
      message: "Semua bidak akan kembali ke Start dengan pemain yang sama.",
      confirmText: "Ya, ulangi",
    });
    if (ok && state) restart();
  });

  el.menuBtn.addEventListener("click", () => {
    if (busy) return;
    persist(); // permainan tetap bisa dilanjutkan dari pemilihan mode
    openSetup();
  });

  el.soundBtn.addEventListener("click", () => {
    const muted = Sound.toggle();
    syncSoundButton(muted);
  });

  function syncSoundButton(muted) {
    el.soundBtn.textContent = muted ? "🔇" : "🔊";
    el.soundBtn.setAttribute("aria-pressed", String(muted));
    el.soundBtn.title = muted ? "Suara mati" : "Suara menyala";
  }

  /* ==========================================================
     10. MULAI
     ========================================================== */
  Board.build();
  syncSoundButton(Sound.isMuted());

  const wantsResume = new URLSearchParams(location.search).get("resume") === "1";
  const saved = Store.getSavedGame(user.username);
  if (wantsResume && saved) {
    resumeGame(saved);
  } else {
    openSetup();
  }
});
