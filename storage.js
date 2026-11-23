/* ==========================================================
   storage.js — pembungkus Local Storage
   Menyimpan: akun, sesi login, riwayat permainan,
   permainan yang belum selesai, dan pengaturan suara.
   ========================================================== */

const Store = (() => {
  const KEY = {
    users: "sa_users",
    session: "sa_session",
    games: "sa_games",
    saved: "sa_saved_games",
    muted: "sa_muted",
  };

  /* ---------- Fungsi dasar (aman dari error) ---------- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  const norm = (name) => String(name || "").trim().toLowerCase();

  /* ---------- Akun ---------- */
  function getUsers() {
    return read(KEY.users, {});
  }

  function findUser(username) {
    return getUsers()[norm(username)] || null;
  }

  function addUser(user) {
    const users = getUsers();
    users[norm(user.username)] = user;
    return write(KEY.users, users);
  }

  /* ---------- Sesi login ---------- */
  function getSession() {
    const session = read(KEY.session, null);
    return session && session.username ? session : null;
  }

  function setSession(username) {
    return write(KEY.session, { username, loginAt: new Date().toISOString() });
  }

  function clearSession() {
    try {
      localStorage.removeItem(KEY.session);
    } catch (err) {
      /* abaikan */
    }
  }

  /* ---------- Riwayat permainan ---------- */
  function getAllGames() {
    return read(KEY.games, []);
  }

  function getGames(username) {
    return getAllGames().filter((g) => norm(g.user) === norm(username));
  }

  function addGame(record) {
    const all = getAllGames();
    all.push(record);
    return write(KEY.games, all.slice(-500)); // batasi agar storage tidak penuh
  }

  function clearGames(username) {
    write(KEY.games, getAllGames().filter((g) => norm(g.user) !== norm(username)));
  }

  /* ---------- Permainan yang belum selesai ---------- */
  function getSavedGame(username) {
    return read(KEY.saved, {})[norm(username)] || null;
  }

  function setSavedGame(username, state) {
    const all = read(KEY.saved, {});
    all[norm(username)] = state;
    return write(KEY.saved, all);
  }

  function clearSavedGame(username) {
    const all = read(KEY.saved, {});
    delete all[norm(username)];
    write(KEY.saved, all);
  }

  /* ---------- Skor & statistik ---------- */
  // Menang: 500 - (5 x jumlah lemparan), minimal 100. Kalah: 10 poin hiburan.
  function calcScore(won, rolls) {
    return won ? Math.max(100, 500 - rolls * 5) : 10;
  }

  function getStats(username) {
    const games = getGames(username);
    const wins = games.filter((g) => g.won);
    const played = games.length;
    return {
      played,
      wins: wins.length,
      losses: played - wins.length,
      winRate: played ? Math.round((wins.length / played) * 100) : 0,
      highScore: games.reduce((max, g) => Math.max(max, g.score || 0), 0),
      bestRolls: wins.length ? Math.min(...wins.map((g) => g.rolls)) : null,
      totalScore: games.reduce((sum, g) => sum + (g.score || 0), 0),
    };
  }

  function getLeaderboard(limit = 5) {
    return Object.values(getUsers())
      .map((u) => ({ username: u.username, ...getStats(u.username) }))
      .filter((row) => row.played > 0)
      .sort((a, b) => b.highScore - a.highScore || b.wins - a.wins)
      .slice(0, limit);
  }

  /* ---------- Suara ---------- */
  const isMuted = () => read(KEY.muted, false) === true;
  const setMuted = (value) => write(KEY.muted, !!value);

  return {
    getUsers, findUser, addUser,
    getSession, setSession, clearSession,
    getGames, addGame, clearGames,
    getSavedGame, setSavedGame, clearSavedGame,
    calcScore, getStats, getLeaderboard,
    isMuted, setMuted,
  };
})();
