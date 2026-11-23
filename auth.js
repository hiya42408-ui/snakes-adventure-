/* ==========================================================
   auth.js — Register, Login, Logout & penjaga halaman
   Catatan: ini proyek belajar tanpa server. Password hanya
   di-hash sederhana di browser (bukan keamanan tingkat produksi).
   ========================================================== */

const Auth = (() => {
  /* Hash sederhana (cyrb53) + garam = username. Mengembalikan string heksadesimal. */
  function hash(password, username) {
    const str = `sa::${String(username).toLowerCase()}::${password}`;
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  /* ---------- Validasi ---------- */
  function validateUsername(username) {
    if (!username) return "Username wajib diisi.";
    if (username.length < 3) return "Username minimal 3 karakter.";
    if (username.length > 16) return "Username maksimal 16 karakter.";
    if (!/^[A-Za-z0-9_]+$/.test(username)) return "Username hanya boleh huruf, angka, dan garis bawah (_).";
    return "";
  }

  function validatePassword(password) {
    if (!password) return "Password wajib diisi.";
    if (password.length < 6) return "Password minimal 6 karakter.";
    return "";
  }

  /* ---------- Register ---------- */
  function register({ username, password, confirm }) {
    username = String(username || "").trim();

    const userError = validateUsername(username);
    if (userError) return { ok: false, field: "username", error: userError };

    const passError = validatePassword(password);
    if (passError) return { ok: false, field: "password", error: passError };

    if (password !== confirm) return { ok: false, field: "confirm", error: "Konfirmasi password tidak sama." };

    if (Store.findUser(username)) return { ok: false, field: "username", error: "Username sudah dipakai. Coba yang lain." };

    const saved = Store.addUser({
      username,
      passHash: hash(password, username),
      createdAt: new Date().toISOString(),
    });
    if (!saved) return { ok: false, field: "", error: "Gagal menyimpan akun. Pastikan Local Storage browser aktif." };

    return { ok: true };
  }

  /* ---------- Login ---------- */
  function login({ username, password }) {
    username = String(username || "").trim();
    if (!username || !password) return { ok: false, error: "Username dan password wajib diisi." };

    const user = Store.findUser(username);
    if (!user || user.passHash !== hash(password, user.username)) {
      return { ok: false, error: "Username atau password salah." };
    }
    Store.setSession(user.username);
    return { ok: true, user };
  }

  /* ---------- Logout (akun & data permainan tidak dihapus) ---------- */
  function logout() {
    Store.clearSession();
  }

  /* ---------- Sesi ---------- */
  function current() {
    const session = Store.getSession();
    if (!session) return null;
    const user = Store.findUser(session.username);
    if (!user) {
      Store.clearSession();
      return null;
    }
    return user;
  }

  /* Halaman yang butuh login (dashboard, game). */
  function requireLogin() {
    const user = current();
    if (!user) {
      Ui.flash("Silakan login terlebih dahulu.", "error");
      location.replace("login.html");
      return null;
    }
    return user;
  }

  /* Halaman tamu (login, register): jika sudah login, ke dashboard. */
  function redirectIfLoggedIn() {
    if (current()) location.replace("dashboard.html");
  }

  return { validateUsername, validatePassword, register, login, logout, current, requireLogin, redirectIfLoggedIn };
})();
