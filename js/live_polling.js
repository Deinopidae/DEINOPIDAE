(function() {
  var SERVER_URL = "https://deinopidae-api.onrender.com";
  var lastDataHash = "";

  function pollServerData() {
    var token = localStorage.getItem("dnp_auth_token");

    // 1. Проверка сессии с передачей токена в заголовке
    if (token) {
      fetch(SERVER_URL + "/api/auth/me", {
        headers: { "Authorization": "Bearer " + token }
      })
      .then(function(res) { return res.json(); })
      .then(function(authRes) {
        if (authRes && authRes.authenticated) {
          localStorage.setItem("dnp_active_user", JSON.stringify(authRes.user));
          if (typeof window.renderAuthHeader === "function") {
            window.renderAuthHeader();
          }
        } else if (authRes && authRes.authenticated === false) {
          // Удаляем только если сервер ответил, что токен недействителен
          localStorage.removeItem("dnp_active_user");
          localStorage.removeItem("dnp_auth_token");
          if (typeof window.renderAuthHeader === "function") {
            window.renderAuthHeader();
          }
        }
      })
      .catch(function() {
        // При ошибке соединения НЕ стираем пользователя (сервер может просыпаться)
      });
    }

    // 2. Поллинг данных Google Таблицы
    fetch(SERVER_URL + "/api/users/data")
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var currentHash = JSON.stringify(data);

        if (lastDataHash && lastDataHash !== currentHash) {
          var termOutput = document.getElementById("term-output");
          if (termOutput) {
            var note = document.createElement("div");
            note.className = "dnp-term-resp-line";
            note.style.color = "#4af626";
            note.textContent = "[SYS] БАЗА ДАННЫХ ОБНОВЛЕНА: Реестр синхронизирован с таблицей.";
            termOutput.appendChild(note);
          }
          window.employeeDb = data;
        }

        lastDataHash = currentHash;
        window.employeeDb = data;
      })
      .catch(function() {});
  }

  setInterval(pollServerData, 10000);
  window.addEventListener('DOMContentLoaded', pollServerData);
})();