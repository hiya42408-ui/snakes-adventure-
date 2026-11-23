/* ==========================================================
   home.js — perilaku halaman Home
   - Tombol menyesuaikan status login
   - Menu mobile
   - Animasi muncul saat scroll
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const user = Auth.current();

  /* ---------- Sesuaikan tombol jika sudah login ---------- */
  if (user) {
    const safeName = Ui.escapeHtml(user.username);

    document.getElementById("navActions").innerHTML = `
      <a class="btn btn--gold btn--sm" href="dashboard.html">Dashboard</a>
      <button class="btn btn--ghost btn--sm" id="navLogout" type="button">Logout</button>`;

    document.getElementById("heroCta").innerHTML = `
      <a class="btn btn--gold btn--lg" href="dashboard.html">Lanjut Bermain, ${safeName}</a>
      <button class="btn btn--ghost btn--lg" id="heroLogout" type="button">Logout</button>`;

    ["navLogout", "heroLogout"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", handleLogout);
    });
  }

  function handleLogout() {
    Auth.logout();
    Ui.flash("Kamu sudah logout. Sampai jumpa!", "success");
    location.reload();
  }

  /* ---------- Menu mobile ---------- */
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Animasi muncul saat scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Tahun di footer ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
