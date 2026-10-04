(function () {
  var token = localStorage.getItem("dnp_auth_token");
  if (!token) {
    window.location.href = "../auth.html";
    return;
  }

  var feed = document.getElementById("tickets-feed");

  fetch("https://deinopidae-api.onrender.com/api/forms/my", {
    headers: { "Authorization": "Bearer " + token }
  })
    .then(function (r) { return r.json(); })
    .then(function (tickets) {
      if (!tickets || tickets.length === 0) {
        feed.innerHTML = '<div class="dnp-block" style="color: var(--muted); font-size: 12px;">Зарегистрированных обращений в dnp_tickets_db не обнаружено.</div>';
        return;
      }

      feed.innerHTML = "";
      tickets.forEach(function (t) {
        var card = document.createElement("div");
        card.className = "dnp-block";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "8px";

        var date = new Date(t.submittedAt).toLocaleString("ru-RU");

        card.innerHTML = [
          '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(138, 160, 168, 0.15); padding-bottom: 6px;">',
          '  <strong style="color: #fff; font-family: \'Exo 2\', sans-serif;">[' + t.type + '] ' + t.reportId + '</strong>',
          '  <span style="font-size: 10px; font-weight: 700; border: 1px solid var(--border-active); color: var(--border-active); padding: 2px 6px;">' + (t.status || 'НА ПРОВЕРКЕ') + '</span>',
          '</div>',
          '<p style="font-size: 12px; color: #ccd5d9; line-height: 1.5; margin: 0;">' + t.description + '</p>',
          '<div style="font-size: 11px; color: var(--muted); border-top: 1px solid rgba(138, 160, 168, 0.1); padding-top: 6px;">',
          '  Дата: ' + date + ' | Доп. ссылки: ' + (t.links || 'Отсутствуют'),
          '</div>'
        ].join('');

        feed.appendChild(card);
      });
    })
    .catch(function () {
      feed.innerHTML = '<div class="dnp-block" style="color: var(--danger); font-size: 12px;">Ошибка доступа к базе dnp_tickets_db.</div>';
    });
})();