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
        feed.innerHTML = '<div style="font-size:12px; color:#8aa0a8; padding: 16px 0;">Зарегистрированных обращений в dnp_tickets_db не обнаружено.</div>';
        return;
      }

      feed.innerHTML = "";
      tickets.forEach(function (t) {
        var card = document.createElement("div");
        card.className = "pda-ticket-card";

        var date = new Date(t.submittedAt).toLocaleString("ru-RU");

        card.innerHTML = [
          '<div class="pda-ticket-head">',
          '  <span class="pda-ticket-id">[' + t.type + '] ' + t.reportId + '</span>',
          '  <span class="pda-ticket-status">' + (t.status || 'НА ПРОВЕРКЕ') + '</span>',
          '</div>',
          '<p class="pda-ticket-content">' + t.description + '</p>',
          '<div class="pda-ticket-meta">Дата регистрации: ' + date + ' | Доп. материалы: ' + (t.links || 'Отсутствуют') + '</div>'
        ].join('');

        feed.appendChild(card);
      });
    })
    .catch(function () {
      feed.innerHTML = '<div style="color:#ff5252; font-size:12px;">Ошибка доступа к базе dnp_tickets_db.</div>';
    });
})();