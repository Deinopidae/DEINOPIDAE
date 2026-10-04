(function() {
  var token = localStorage.getItem("dnp_auth_token");
  if (!token) {
    window.location.href = "../auth.html";
    return;
  }

  fetch("https://deinopidae-api.onrender.com/api/user/profile", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.error) {
      alert("Сессия устарела. Авторизуйтесь заново.");
      window.location.href = "../auth.html";
      return;
    }

    var acc = data.account;
    var st = data.staff || {};

    document.getElementById("prof-name").textContent = (acc.displayName || acc.username) + " (" + acc.roblox + ")";
    if (acc.avatar) {
      document.getElementById("prof-avatar").src = acc.avatar;
    }

    var badge = document.getElementById("prof-activity-status");
    badge.textContent = acc.activityStatus || "В АКТИВЕ";
    if (acc.activityStatus === "Инактив") {
      badge.className = "dossier-activity-badge is-inactive";
    } else {
      badge.className = "dossier-activity-badge is-active";
    }

    document.getElementById("p-rank").textContent = (st.title || "Сотрудник") + " [" + (st.rank || "Кадет") + "]";
    document.getElementById("p-norm").textContent = (st.mp || "0/0") + " МП / " + (st.hours || "0:00") + " ч.";
    document.getElementById("p-quota").textContent = st.quota_status || "В ОБРАБОТКЕ";
    document.getElementById("p-promo").textContent = st.promotion || "Проверяется аналитиком";
    document.getElementById("p-vacation").textContent = st.vacation || "НЕТ";
    document.getElementById("p-penalties").textContent = st.penalties || "N/A";
    document.getElementById("p-coins").textContent = (st.coins || "0") + " койнов / " + (st.activity || "0") + " PTS";
  })
  .catch(function() {
    document.getElementById("prof-name").textContent = "ОШИБКА ПОДКЛЮЧЕНИЯ К БАЗЕ";
  });
})();