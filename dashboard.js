/* ==========================================================
   dashboard.js — logika halaman Dashboard
   Menampilkan username, statistik, riwayat, papan peringkat,
   tombol Mulai/Lanjutkan, Reset data, dan Logout.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const user = Auth.requireLogin(); // jika belum login → diarahkan ke Login
  if (!user) return;

  const $ = (id) => document.getElementById(id);

  /* ---------- Identitas pemain ---------- */
  $("navUsername").textContent = user.username;
  $("welcomeName").textContent = user.username;

  /* ---------- Render semua data ---------- */
  function render() {
    renderStats();
    renderHistory();
    renderLeaderboard();
    renderResume();
  }

  function renderStats() {
    const s = Store.getStats(user.username);
    $("statPlayed").textContent = s.played;
    $("statWins").textContent = s.wins;
    $("statLosses").textContent = s.losses;
    $("statRate").textContent = `${s.winRate}%`;
    $("statHigh").textContent = s.highScore;
    $("statBest").textContent = s.bestRolls === null ? "-" : s.bestRolls;

    $("welcomeMsg").textContent = s.played
      ? `Kamu sudah bermain ${s.played} kali dan menang ${s.wins} kali. Ayo pecahkan rekormu!`
      : "Siap menaklukkan petak ke-100? Mulai permainan pertamamu sekarang.";
  }

  function renderHistory() {
    const games = Store.getGames(user.username).slice().reverse().slice(0, 10); // 10 terbaru
    const body = $("historyBody");

    $("historyTable").classList.toggle("hidden", games.length === 0);
    $("historyEmpty").classList.toggle("hidden", games.length > 0);

    body.innerHTML = games
      .map(
        (g) => `
        <tr>
          <td>${Ui.escapeHtml(Ui.formatDate(g.date))}</td>
          <td>${Ui.escapeHtml(g.modeLabel || g.mode)}</td>
          <td><span class="badge ${g.won ? "badge--win" : "badge--lose"}">${g.won ? "Menang" : "Kalah"}</span></td>
          <td class="num">${Number(g.rolls) || 0}</td>
          <td class="num">${Number(g.score) || 0}</td>
        </tr>`
      )
      .join("");
  }

  function renderLeaderboard() {
    const rows = Store.getLeaderboard(5);
    $("leaderboardEmpty").classList.toggle("hidden", rows.length > 0);

    $("leaderboard").innerHTML = rows
      .map(
        (r) => `
        <li class="${r.username.toLowerCase() === user.username.toLowerCase() ? "is-me" : ""}">
          <span class="name">${Ui.escapeHtml(r.username)}</span>
          <span class="score">${r.highScore}</span>
        </li>`
      )
      .join("");
  }

  function renderResume() {
    $("resumeBtn").classList.toggle("hidden", !Store.getSavedGame(user.username));
  }

  /* ---------- Reset data permainan (akun tetap ada) ---------- */
  $("resetBtn").addEventListener("click", async () => {
    const ok = await Ui.confirmDialog({
      title: "Reset data permainan?",
      message: "Riwayat, statistik, dan permainan yang belum selesai akan dihapus. Akunmu tidak ikut terhapus.",
      confirmText: "Ya, reset",
      danger: true,
    });
    if (!ok) return;
    Store.clearGames(user.username);
    Store.clearSavedGame(user.username);
    render();
    Ui.toast("Data permainan berhasil direset.", "success");
  });

  /* ---------- Logout ---------- */
  $("logoutBtn").addEventListener("click", () => {
    Auth.logout();
    Ui.flash("Kamu berhasil logout.", "success");
    location.replace("login.html");
  });

  render();
});
