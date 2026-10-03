// Обработчик подачи форм отчетов в КПК
(function() {
  var SUBMIT_URL = "http://localhost:3000/api/forms/submit";

  window.submitReportForm = function(event) {
    if (event) event.preventDefault();

    var nickInput = document.getElementById("form-nick");
    var typeSelect = document.getElementById("form-type");
    var descInput = document.getElementById("form-desc");
    var proofInput = document.getElementById("form-proof");
    var statusBox = document.getElementById("form-status-box");

    if (!nickInput || !typeSelect) return;

    var token = window.CookieManager ? window.CookieManager.getUserToken() : "UNKNOWN";

    var payload = {
      token: token,
      nickname: nickInput.value.trim(),
      type: typeSelect.value,
      description: descInput ? descInput.value.trim() : "",
      screenshots: proofInput ? proofInput.value.trim() : ""
    };

    if (!payload.nickname) {
      if (statusBox) statusBox.textContent = "[ОШИБКА] Укажите ваш позывной/никнейм.";
      return;
    }

    if (statusBox) statusBox.textContent = "[SYS] Передача данных на сервер...";

    fetch(SUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        if (statusBox) {
          statusBox.style.color = "#4af626";
          statusBox.textContent = "[УСПЕХ] Отчет " + data.reportId + " принят в обработку и передан в Discord!";
        }
        // Очищаем форму
        if (descInput) descInput.value = "";
        if (proofInput) proofInput.value = "";
      } else {
        if (statusBox) {
          statusBox.style.color = "#ff5252";
          statusBox.textContent = "[ОШИБКА] " + (data.error || "Не удалось отправить отчет.");
        }
      }
    })
    .catch(function(err) {
      if (statusBox) {
        statusBox.style.color = "#ff5252";
        statusBox.textContent = "[СБОЙ СЕТИ] Сервер не отвечает. Проверьте запуск node server.js.";
      }
    });
  };
})();