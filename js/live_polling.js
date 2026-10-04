(function() {
  var SERVER_URL = "https://deinopidae-api.onrender.com";
  var lastDataHash = "";

  // Функция переключения индикатора состояния сети в навигации
  function setNetStatus(isOnline) {
    var netStatusEl = document.getElementById("dnp-local-net-status");
    if (!netStatusEl) return;

    if (isOnline) {
      netStatusEl.textContent = "LOCAL NET: STABLE";
      netStatusEl.style.color = ""; // штатный цвет
    } else {
      netStatusEl.textContent = "LOCAL NET: ERROR";
      netStatusEl.style.color = "var(--danger)"; // красная подсветка ошибки
    }
  }

  function pollServerData() {
    var token = localStorage.getItem("dnp_auth_token");

    // 1. Проверка сессии с передачей токена
    if (token) {
      fetch(SERVER_URL + "/api/auth/me", {
        headers: { "Authorization": "Bearer " + token }
      })
      .then(function(res) {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(function(authRes) {
        setNetStatus(true);
        if (authRes && authRes.authenticated) {
          localStorage.setItem("dnp_active_user", JSON.stringify(authRes.user));
          if (typeof window.renderAuthHeader === "function") {
            window.renderAuthHeader();
          }
        } else if (authRes && authRes.authenticated === false) {
          localStorage.removeItem("dnp_active_user");
          localStorage.removeItem("dnp_auth_token");
          if (typeof window.renderAuthHeader === "function") {
            window.renderAuthHeader();
          }
        }
      })
      .catch(function() {
        setNetStatus(false);
      });
    }

    // 2. Поллинг данных реестра сотрудников и проверка онлайн-статуса
    fetch(SERVER_URL + "/api/users/data")
      .then(function(res) {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(function(data) {
        setNetStatus(true);
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
      .catch(function() {
        setNetStatus(false);
      });
  }

  // Опрос сервера каждые 10 секунд
  setInterval(pollServerData, 10000);
  window.addEventListener('DOMContentLoaded', pollServerData);
})();