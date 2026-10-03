// Автоматический поллинг сервера каждые 10 секунд
(function() {
  var API_URL = "http://localhost:3000/api/users/data";
  var lastDataHash = "";

  function pollServerData() {
    fetch(API_URL)
      .then(function(res) {
        if (!res.ok) throw new Error("Сервер недоступен");
        return res.json();
      })
      .then(function(data) {
        var currentHash = JSON.stringify(data);

        // Если это первый запуск или данные изменились в таблице
        if (lastDataHash && lastDataHash !== currentHash) {
          console.log("[POLL] База данных сотрудников обновлена из Google Sheets!");

          // Если открыт терминал — оповещаем пользователя
          var termOutput = document.getElementById("term-output");
          if (termOutput) {
            var note = document.createElement("div");
            note.className = "dnp-term-resp-line";
            note.style.color = "#4af626";
            note.textContent = "[SYS] ОБНАРУЖЕНО ИЗМЕНЕНИЕ БАЗЫ ДАННЫХ: Таблица синхронизирована.";
            termOutput.appendChild(note);
          }

          // Обновляем локальный объект базы в скрипте
          if (window.employeeDb) {
            window.employeeDb = data;
          }
        }

        lastDataHash = currentHash;
        window.employeeDb = data;
      })
      .catch(function(err) {
        // Ошибки сервера в штатном режиме скрываем
      });
  }

  // Запуск проверки строго каждые 10 секунд
  setInterval(pollServerData, 10000);
  window.addEventListener('DOMContentLoaded', pollServerData);
})();