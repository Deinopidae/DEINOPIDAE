(function () {
  var SERVER_URL = "https://deinopidae-api.onrender.com";
  var lastDataHash = "";

  function setNetStatus(isOnline, errCode) {
    var netStatusEl = document.getElementById("dnp-local-net-status");
    if (!netStatusEl) return;

    if (isOnline) {
      netStatusEl.textContent = "LOCAL NET: STABLE";
      netStatusEl.style.color = "";
    } else {
      var code = errCode || "SERVER_DISCONN";
      netStatusEl.textContent = "LOCAL NET: ERROR(" + code + ")";
      netStatusEl.style.color = "#ff5252";
    }
  }
  window.setNetStatus = setNetStatus;

  window.addEventListener('offline', function () {
    setNetStatus(false, 'OFFLINE');
  });
  window.addEventListener('online', function () {
    setNetStatus(true);
  });

  window.renderAuthHeader = function () {
    var slot = document.getElementById("dnp-auth-header-slot");
    if (!slot) return;

    var rawUser = localStorage.getItem("dnp_active_user");
    if (rawUser) {
      try {
        var u = JSON.parse(rawUser);
        var avatarHtml = '';
        if (u.avatar && u.avatar.length > 5) {
          avatarHtml = '<img src="' + u.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">';
        } else {
          avatarHtml = (u.displayName || u.username || 'U')[0].toUpperCase();
        }

        slot.innerHTML = [
          '<div class="dnp-user-pill" id="dnp-user-pill">',
          '  <div class="dnp-user-avatar">' + avatarHtml + '</div>',
          '  <span class="dnp-user-name">' + (u.displayName || u.username || 'OPERATOR') + '</span>',
          '</div>',
          '<div class="dnp-user-dropdown" id="dnp-user-dropdown" style="display: none;">',
          '  <button type="button" class="dnp-dropdown-item" onclick="openScreen(\'tickets\')">Обращения</button>',
          '  <button type="button" class="dnp-dropdown-item" onclick="openScreen(\'notifications\')">Уведомления</button>',
          '  <button type="button" class="dnp-dropdown-item is-logout" id="dnp-menu-logout">Выйти из аккаунта</button>',
          '</div>'
        ].join('');

        var pill = document.getElementById("dnp-user-pill");
        var dd = document.getElementById("dnp-user-dropdown");
        
        pill.addEventListener("click", function (e) {
          e.stopPropagation();
          dd.style.display = dd.style.display === "none" ? "flex" : "none";
        });

        document.addEventListener("click", function () {
          if (dd) dd.style.display = "none";
        });

        document.getElementById("dnp-menu-logout").addEventListener("click", function () {
          localStorage.removeItem("dnp_active_user");
          localStorage.removeItem("dnp_auth_token");
          window.renderAuthHeader();
          if (window.openScreen) window.openScreen("ustav-01");
          location.reload();
        });
        return;
      } catch (e) {}
    }

    slot.innerHTML = '<a href="auth.html" class="dnp-auth-btn" id="dnp-auth-link">ЛИЧНЫЙ КАБИНЕТ</a>';
  };

  function pollServerData() {
    var token = localStorage.getItem("dnp_auth_token");

    if (!navigator.onLine) {
      setNetStatus(false, 'OFFLINE');
      return;
    }

    if (token) {
      fetch(SERVER_URL + "/api/auth/me", {
        headers: { "Authorization": "Bearer " + token }
      })
        .then(function (res) {
          if (!res.ok) {
            setNetStatus(false, "HTTP_" + res.status);
            throw new Error("HTTP " + res.status);
          }
          return res.json();
        })
        .then(function (authRes) {
          setNetStatus(true);
          if (authRes && authRes.authenticated) {
            localStorage.setItem("dnp_active_user", JSON.stringify(authRes.user));
            window.renderAuthHeader();
          } else if (authRes && authRes.authenticated === false) {
            localStorage.removeItem("dnp_active_user");
            localStorage.removeItem("dnp_auth_token");
            window.renderAuthHeader();
          }
        })
        .catch(function (err) {
          if (err.message && err.message.indexOf("HTTP") === 0) return;
          setNetStatus(false, "CONN_LOST");
        });
    } else {
      window.renderAuthHeader();
    }

    fetch(SERVER_URL + "/api/users/data")
      .then(function (res) {
        if (!res.ok) {
          setNetStatus(false, "HTTP_" + res.status);
          throw new Error("HTTP " + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        setNetStatus(true);
        var currentHash = JSON.stringify(data);
        if (lastDataHash && lastDataHash !== currentHash) {
          window.employeeDb = data;
        }
        lastDataHash = currentHash;
        window.employeeDb = data;
      })
      .catch(function (err) {
        if (!navigator.onLine) {
          setNetStatus(false, "OFFLINE");
        } else if (err.message && err.message.indexOf("HTTP") !== 0) {
          setNetStatus(false, "CONN_TIMEOUT");
        }
      });
  }

  setInterval(pollServerData, 12000);
  window.addEventListener('DOMContentLoaded', pollServerData);
})();