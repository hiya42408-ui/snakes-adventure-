/* ==========================================================
   ui.js — helper tampilan yang dipakai semua halaman
   Toast, pesan flash antar halaman, dialog konfirmasi,
   tombol lihat/sembunyikan password, format tanggal.
   ========================================================== */

const Ui = (() => {
  const FLASH_KEY = "sa_flash";

  /* ---------- Escape HTML (cegah XSS dari username) ---------- */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  /* ---------- Toast ---------- */
  function toast(message, type = "info", duration = 3200) {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 260);
    }, duration);
  }

  /* ---------- Pesan flash (tampil di halaman berikutnya) ---------- */
  function flash(message, type = "info") {
    try {
      sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, type }));
    } catch (err) {
      /* abaikan */
    }
  }

  function consumeFlash() {
    try {
      const raw = sessionStorage.getItem(FLASH_KEY);
      sessionStorage.removeItem(FLASH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  /* ---------- Dialog konfirmasi ---------- */
  function confirmDialog({ title, message, confirmText = "Ya", cancelText = "Batal", danger = false }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.innerHTML = `
        <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <h2 id="dlg-title">${escapeHtml(title)}</h2>
          <p class="text-muted">${escapeHtml(message)}</p>
          <div class="modal__actions">
            <button class="btn btn--ghost btn--sm" data-act="cancel">${escapeHtml(cancelText)}</button>
            <button class="btn ${danger ? "btn--danger" : "btn--gold"} btn--sm" data-act="ok">${escapeHtml(confirmText)}</button>
          </div>
        </div>`;
      const close = (result) => {
        backdrop.remove();
        document.removeEventListener("keydown", onKey);
        resolve(result);
      };
      const onKey = (e) => e.key === "Escape" && close(false);
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) close(false);
        const act = e.target.dataset && e.target.dataset.act;
        if (act) close(act === "ok");
      });
      document.addEventListener("keydown", onKey);
      document.body.appendChild(backdrop);
      backdrop.querySelector('[data-act="ok"]').focus();
    });
  }

  /* ---------- Tombol lihat/sembunyikan password ---------- */
  function bindPasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.togglePassword);
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Sembunyi" : "Lihat";
        btn.setAttribute("aria-pressed", String(show));
      });
    });
  }

  /* ---------- Format ---------- */
  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return { escapeHtml, toast, flash, consumeFlash, confirmDialog, bindPasswordToggles, formatDate };
})();

document.addEventListener("DOMContentLoaded", () => {
  Ui.bindPasswordToggles();
  const flash = Ui.consumeFlash();
  if (flash) Ui.toast(flash.message, flash.type);
});
