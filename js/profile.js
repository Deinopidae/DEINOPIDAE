(function () {
  var token = localStorage.getItem("dnp_auth_token");
  if (!token) {
    window.location.href = "../auth.html";
    return;
  }

  fetch("https://deinopidae-api.onrender.com/api/user/profile", {
    headers: { "Authorization": "Bearer " + token }
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || data.error) {
        window.location.href = "../auth.html";
        return;
      }

      var acc = data.account || {};
      var st = data.staff || {};

      document.getElementById("prof-display-name").textContent =
        (acc.displayName || acc.username).toUpperCase() + " // " + acc.roblox;

      if (acc.avatar && acc.avatar.length > 5) {
        document.getElementById("prof-avatar").src = acc.avatar;
      }

      var badge = document.getElementById("prof-activity-badge");
      badge.textContent = acc.activityStatus || "В АКТИВЕ";
      if (acc.activityStatus === "Инактив") {
        badge.style.background = "rgba(255, 82, 82, 0.12)";
        badge.style.borderColor = "#ff5252";
        badge.style.color = "#ff5252";
      } else {
        badge.style.background = "rgba(74, 246, 38, 0.12)";
        badge.style.borderColor = "#4af626";
        badge.style.color = "#4af626";
      }

      document.getElementById("p-rank").textContent = (st.title || "Сотрудник") + " [" + (st.rank || "Кадет") + "]";
      document.getElementById("p-norm").textContent = (st.mp || "0/0") + " МП / " + (st.hours || "0:00") + " ч.";
      document.getElementById("p-equip").textContent = (st.equipment || "0") + " ед.";
      document.getElementById("p-quota").textContent = st.quota_status || "В ОБРАБОТКЕ";
      document.getElementById("p-promo").textContent = st.promotion || "Проверяется руководством";
      document.getElementById("p-vacation").textContent = st.vacation || "НЕТ";
      document.getElementById("p-penalties").textContent = st.penalties || "N/A";
      document.getElementById("p-coins").textContent = (st.coins || "0") + " койнов / " + (st.activity || "0") + " PTS";
    })
    .catch(function () {
      document.getElementById("prof-display-name").textContent = "СБОЙ СВЯЗИ С ЯДРОМ";
    });
})();