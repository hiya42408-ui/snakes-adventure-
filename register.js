/* ==========================================================
   register.js — logika halaman Register
   Validasi langsung, meter kekuatan password, simpan akun.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  Auth.redirectIfLoggedIn();

  const form = document.getElementById("registerForm");
  const alertBox = document.getElementById("formAlert");
  const fields = {
    username: { input: document.getElementById("username"), error: document.getElementById("usernameError") },
    password: { input: document.getElementById("password"), error: document.getElementById("passwordError") },
    confirm: { input: document.getElementById("confirm"), error: document.getElementById("confirmError") },
  };
  const strengthBar = document.getElementById("strengthBar");
  const strengthText = document.getElementById("strengthText");

  /* ---------- Tampilkan / hapus pesan error per field ---------- */
  function setFieldState(name, message) {
    const { input, error } = fields[name];
    error.textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    input.classList.toggle("is-valid", !message && input.value !== "");
  }

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("hidden");
  }

  function hideAlert() {
    alertBox.classList.add("hidden");
  }

  /* ---------- Validasi per field ---------- */
  const validators = {
    username: () => Auth.validateUsername(fields.username.input.value.trim()),
    password: () => Auth.validatePassword(fields.password.input.value),
    confirm: () => {
      const { password, confirm } = { password: fields.password.input.value, confirm: fields.confirm.input.value };
      if (!confirm) return "Konfirmasi password wajib diisi.";
      return password === confirm ? "" : "Konfirmasi password tidak sama.";
    },
  };

  /* Validasi saat pengguna selesai mengetik (blur) dan saat mengubah isian yang sudah salah. */
  Object.keys(fields).forEach((name) => {
    const { input } = fields[name];
    input.addEventListener("blur", () => setFieldState(name, validators[name]()));
    input.addEventListener("input", () => {
      hideAlert();
      if (input.classList.contains("is-invalid") || input.classList.contains("is-valid")) {
        setFieldState(name, validators[name]());
      }
      if (name === "password") {
        updateStrength(input.value);
        if (fields.confirm.input.value) setFieldState("confirm", validators.confirm());
      }
    });
  });

  /* ---------- Kekuatan password ---------- */
  function updateStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { width: "0%", color: "var(--danger)", text: "Gunakan kombinasi huruf, angka, dan simbol." },
      { width: "25%", color: "var(--danger)", text: "Password lemah." },
      { width: "50%", color: "#ffb347", text: "Password cukup." },
      { width: "75%", color: "var(--gold-400)", text: "Password kuat." },
      { width: "100%", color: "var(--success)", text: "Password sangat kuat!" },
    ];
    const level = password ? levels[Math.min(Math.max(score - 1, 1), 4)] : levels[0];
    strengthBar.style.width = level.width;
    strengthBar.style.background = level.color;
    strengthText.textContent = level.text;
  }

  /* ---------- Kirim form ---------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideAlert();

    // Validasi semua field sekaligus
    let firstInvalid = null;
    Object.keys(fields).forEach((name) => {
      const message = validators[name]();
      setFieldState(name, message);
      if (message && !firstInvalid) firstInvalid = fields[name].input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const result = Auth.register({
      username: fields.username.input.value,
      password: fields.password.input.value,
      confirm: fields.confirm.input.value,
    });

    if (!result.ok) {
      if (result.field && fields[result.field]) {
        setFieldState(result.field, result.error);
        fields[result.field].input.focus();
      } else {
        showAlert(result.error);
      }
      return;
    }

    Ui.flash("Registrasi berhasil! Silakan login.", "success");
    location.href = "login.html";
  });
});
