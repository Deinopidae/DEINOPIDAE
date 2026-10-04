(function() {
  var token = localStorage.getItem("dnp_auth_token");
  if (!token) { window.location.href = "../auth.html"; return; }

  var list = document.getElementById("tickets-list");

  fetch("https://deinopidae-api.onrender.com/api/forms/my", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(function(res) { return res.json(); })
  .then(function(tickets) {
    if (!tickets || tickets.length === 0) {
      list.innerHTML = '<div class="ticket-empty">У вас пока нет зарегистрированных обращений.</div>';
      return;
    }

    list.innerHTML = "";
    tickets.forEach(function(t) {
      var card = document.createElement("div");
      card.className = "ticket-card";

      var dateStr = new Date(t.submittedAt).toLocaleString("ru-RU");

      card.innerHTML = [
        '<div class="ticket-head">',
        '  <span class="ticket-id">[' + t.type + '] ' + t.reportId + '</span>',
        '  <span class="ticket-status">' + (t.status || 'НА ПРОВЕРКЕ') + '</span>',
        '</div>',
        '<p class="ticket-desc">' + t.description + '</p>',
        '<div class="ticket-meta">Дата подачи: ' + dateStr + ' | Доп. ссылки: ' + (t.links || 'Нет') + '</div>'
      ].join('');

      list.appendChild(card);
    });
  })
  .catch(function() {
    list.innerHTML = '<div class="ticket-empty" style="color:#ff5252;">Ошибка соединения с dnp_tickets_db.</div>';
  });
})();