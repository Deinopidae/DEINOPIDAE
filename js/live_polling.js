(function () {
  var SERVER_URL = "https://deinopidae-api.onrender.com";
  var lastDataHash = "";

  function setNetStatus(isOnline) {
    var netStatusEl = document.getElementById("dnp-local-net-status");
    if (!netStatusEl) return;

    if (isOnline) {
      netStatusEl.textContent = "LOCAL NET: STABLE";
      netStatusEl.style.color = "";
    } else {
      netStatusEl.textContent = "LOCAL NET: ERROR";
      netStatusEl.style.color = "#ff5252";
    }
  }

  window.renderAuthHeader = function () {
    var slot = document.getElementById("dnp-auth-header-slot");
    if (!slot) return;

    var inPages = window.location.pathname.indexOf('/pages/') !== -1;
    var pPrefix = inPages ? '' : 'pages/';
    var authPath = inPages ? '../auth.html' : 'auth.html';

    var rawUser = localStorage.getItem("dnp_active_user");
    if (rawUser) {
      try {
        var u = JSON.parse(rawUser);
        var avatarHtml = '';
        if (u.avatar && u.avatar.length > 5) {
          avatarHtml = '<img src="' + u.avatar + '" style="width:100%;height:100%;object-fit:cover;">';
        } else {
          avatarHtml = (u.displayName || u.username || 'U')[0].toUpperCase();
        }

        slot.innerHTML = [
          '<div class="dnp-user-pill" id="dnp-user-pill">',
          '  <div class="dnp-user-avatar">' + avatarHtml + '</div>',
          '  <span class="dnp-user-name">' + (u.displayName || u.username || 'OPERATOR') + '</span>',
          '</div>',
          '<div class="dnp-user-dropdown" id="dnp-user-dropdown" style="display: none;">',
          '  <a href="' + pPrefix + 'profile.html" class="dnp-dropdown-item">Профиль</a>',
          '  <a href="' + pPrefix + 'tickets.html" class="dnp-dropdown-item">Обращения</a>',
          '  <a href="' + pPrefix + 'settings.html" class="dnp-dropdown-item">Настройки</a>',
          '  <div class="dnp-dropdown-item is-logout" id="dnp-menu-logout">Выйти из аккаунта</div>',
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
          location.reload();
        });
        return;
      } catch (e) {}
    }

    slot.innerHTML = '<a href="' + authPath + '" class="dnp-auth-btn">ЛИЧНЫЙ КАБИНЕТ</a>';
  };

  function pollServerData() {
    var token = localStorage.getItem("dnp_auth_token");

    if (token) {
      fetch(SERVER_URL + "/api/auth/me", {
        headers: { "Authorization": "Bearer " + token }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP error " + res.status);
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
        .catch(function () {
          setNetStatus(false);
        });
    } else {
      window.renderAuthHeader();
    }

    fetch(SERVER_URL + "/api/users/data")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP error " + res.status);
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
      .catch(function () {
        setNetStatus(false);
      });
  }

  setInterval(pollServerData, 10000);
  window.addEventListener('DOMContentLoaded', pollServerData);
})();