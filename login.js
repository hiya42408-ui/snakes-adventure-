/* ==========================================================
   login.js — logika halaman Login
   Periksa username & password, tampilkan pesan berhasil/gagal,
   lalu menuju Dashboard.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  Auth.redirectIfLoggedIn();

  const form = document.getElementById("loginForm");
  const alertBox = document.getElementById("formAlert");
  const submitBtn = document.getElementById("submitBtn");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert--${type}`;
  }

  function hideAlert() {
    alertBox.className = "alert alert--error hidden";
  }

  [usernameInput, passwordInput].forEach((input) => input.addEventListener("input", hideAlert));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideAlert();

    const result = Auth.login({ username: usernameInput.value, password: passwordInput.value });

    if (!result.ok) {
      showAlert(result.error, "error");
      form.classList.remove("is-shaking");
      void form.offsetWidth; // restart animasi
      form.classList.add("is-shaking");
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    showAlert(`Login berhasil! Selamat datang, ${result.user.username}.`, "success");
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengalihkan…";
    setTimeout(() => location.replace("dashboard.html"), 800);
  });
});
