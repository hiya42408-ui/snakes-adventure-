/* ==========================================================
   game-sound.js — efek suara sederhana (Web Audio API)
   Tidak memakai file audio; semua dibuat dari nada.
   Status bisu disimpan di Local Storage.
   ========================================================== */

const Sound = (() => {
  let ctx = null;
  let muted = Store.isMuted();

  function context() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* Satu nada: frekuensi, waktu mulai (detik dari sekarang), durasi, jenis gelombang, volume, geser frekuensi. */
  function tone(c, freq, start, duration, type = "sine", volume = 0.12, slideTo = null) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t0 = c.currentTime + start;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  const effects = {
    roll(c) {
      for (let i = 0; i < 7; i++) tone(c, 180 + Math.random() * 260, i * 0.07, 0.05, "square", 0.05);
    },
    step(c) {
      tone(c, 520, 0, 0.07, "triangle", 0.09);
    },
    ladder(c) {
      [392, 494, 587, 784].forEach((f, i) => tone(c, f, i * 0.11, 0.18, "triangle", 0.12));
    },
    snake(c) {
      tone(c, 420, 0, 0.7, "sawtooth", 0.09, 90);
    },
    bonus(c) {
      [880, 1175, 1568].forEach((f, i) => tone(c, f, i * 0.09, 0.16, "sine", 0.1));
    },
    shield(c) {
      tone(c, 300, 0, 0.25, "square", 0.07, 600);
    },
    win(c) {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(c, f, i * 0.14, 0.24, "triangle", 0.14));
    },
  };

  function play(name) {
    if (muted || !effects[name]) return;
    const c = context();
    if (!c) return;
    try {
      effects[name](c);
    } catch (err) {
      /* abaikan error audio */
    }
  }

  function toggle() {
    muted = !muted;
    Store.setMuted(muted);
    return muted;
  }

  return { play, toggle, isMuted: () => muted };
})();
