(function() {
  var SUBMIT_URL = "https://deinopidae-api.onrender.com/api/forms/submit";

  window.submitReportForm = function(event) {
    if (event) event.preventDefault();

    var nickInput = document.getElementById("form-nick");
    var typeSelect = document.getElementById("form-type");
    var descInput = document.getElementById("form-desc");
    var proofInput = document.getElementById("form-proof");
    var statusBox = document.getElementById("form-status-box");

    var token = localStorage.getItem("dnp_auth_token");
    var activeUser = localStorage.getItem("dnp_active_user");

    if (!token || !activeUser) {
      if (statusBox) {
        statusBox.style.color = "var(--danger)";
        statusBox.innerHTML = '[ОТКАЗ] Отправка отчетов заблокирована. Требуется авторизация в <a href="auth.html" style="color: #fff; text-decoration: underline;">Личном кабинете</a>.';
      }
      return;
    }

    var payload = {
      token: token,
      type: typeSelect ? typeSelect.value : "Внеурочка",
      description: descInput ? descInput.value.trim() : "",
      screenshots: proofInput ? proofInput.value.trim() : ""
    };

    if (!payload.description) {
      if (statusBox) {
        statusBox.style.color = "var(--danger)";
        statusBox.textContent = "[ОШИБКА] Заполните описание работы.";
      }
      return;
    }

    if (statusBox) {
      statusBox.style.color = "var(--line)";
      statusBox.textContent = "[SYS] Передача данных на сервер...";
    }

    fetch(SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        if (statusBox) {
          statusBox.style.color = "#4af626";
          statusBox.textContent = "[УСПЕХ] Отчет " + data.reportId + " зарегистрирован в базе данных и передан в Discord!";
        }
        if (descInput) descInput.value = "";
        if (proofInput) proofInput.value = "";
      } else {
        if (statusBox) {
          statusBox.style.color = "#ff5252";
          statusBox.textContent = "[ОШИБКА] " + (data.error || "Не удалось отправить отчет.");
        }
      }
    })
    .catch(function() {
      if (statusBox) {
        statusBox.style.color = "#ff5252";
        statusBox.textContent = "[СБОЙ СЕТИ] Сервер не отвечает. Попробуйте еще раз через несколько секунд.";
      }
    });
  };
})();