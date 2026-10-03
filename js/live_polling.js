(function() {
  var SERVER_URL = "http://localhost:3000";
  var lastDataHash = "";

  function pollServerData() {
    // 1. Проверка актуальности авторизации
    fetch(SERVER_URL + "/api/auth/me", { credentials: "include" })
      .then(function(res) { return res.json(); })
      .then(function(authRes) {
        if (!authRes.authenticated) {
          localStorage.removeItem("dnp_active_user");
        } else {
          localStorage.setItem("dnp_active_user", JSON.stringify(authRes.user));
        }
        if (typeof window.renderAuthHeader === "function") {
          window.renderAuthHeader();
        }
      })
      .catch(function() {});

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