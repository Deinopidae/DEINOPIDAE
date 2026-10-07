(function () {
  var loader = document.getElementById("dnp-loader");
  var loaderBar = document.getElementById("loader-bar");
  var loaderPercent = document.getElementById("loader-percent");
  var loaderPin = document.getElementById("loader-pin");
  var loaderBg = document.getElementById("loader-bg");
  var loaderWipe = document.getElementById("loader-wipe");
  var loaderContent = document.getElementById("loader-content");

  if (loader && loaderBar && loaderPercent && loaderPin && loaderBg && loaderWipe) {
    var currentProgress = 0;
    var targetProgress = 35;
    var isFinished = false;

    // Клик по экрану загрузки мгновенно пропускает его
    loader.addEventListener("click", function () {
      if (!isFinished) {
        isFinished = true;
        completeLoadingSequence();
      }
    });

    // Постепенное увеличение цели загрузки
    if (document.readyState === "complete" || document.readyState === "interactive") {
      targetProgress = 80;
    } else {
      window.addEventListener("DOMContentLoaded", function () {
        targetProgress = 80;
      });
    }

    window.addEventListener("load", function () {
      targetProgress = 100;
    });

    // Аварийный таймер: через 1.5 секунды гарантированно открывает сайт
    setTimeout(function () {
      targetProgress = 100;
      if (!isFinished && currentProgress >= 90) {
        isFinished = true;
        completeLoadingSequence();
      }
    }, 1200);

    setTimeout(function () {
      if (!isFinished) {
        isFinished = true;
        completeLoadingSequence();
      }
    }, 2500);

    function renderLoader() {
      if (isFinished) return;

      if (currentProgress < targetProgress) {
        var step = (targetProgress - currentProgress) * 0.15;
        currentProgress += Math.max(0.8, step);
        if (currentProgress >= 100) currentProgress = 100;
      }

      var progFloor = Math.floor(currentProgress);
      loaderPercent.textContent = progFloor;
      loaderBar.style.height = currentProgress + "%";

      var trackHeight = loader.clientHeight || window.innerHeight;
      var currentY = (trackHeight * currentProgress) / 100;
      var clampedY = Math.min(Math.max(currentY, 28), trackHeight - 48);
      loaderPin.style.top = clampedY + "px";

      var currentBlur = (20 * (1 - currentProgress / 100)).toFixed(1);
      loaderBg.style.filter = "blur(" + currentBlur + "px)";

      if (currentProgress >= 100) {
        isFinished = true;
        completeLoadingSequence();
        return;
      }

      requestAnimationFrame(renderLoader);
    }

    function completeLoadingSequence() {
      loaderPercent.textContent = "100";
      loaderBar.style.height = "100%";
      loaderBg.style.filter = "blur(0px)";

      setTimeout(function () {
        loaderWipe.classList.add("wipe-in");

        setTimeout(function () {
          if (loaderContent) loaderContent.style.opacity = "0";
          if (loaderBg) loaderBg.style.opacity = "0";

          loaderWipe.classList.remove("wipe-in");
          loaderWipe.classList.add("wipe-out");

          setTimeout(function () {
            loader.style.opacity = "0";
            setTimeout(function () {
              loader.style.display = "none";
            }, 250);
          }, 350);
        }, 350);
      }, 150);
    }

    requestAnimationFrame(renderLoader);
  }

  // ==========================================
  // НАВИГАЦИЯ И ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
  // ==========================================
  var root = document.getElementById("dnp-pda");
  var layout = document.getElementById("dnp-layout");
  if (!root) return;

  var buttons = root.querySelectorAll("[data-screen]");
  var panels = root.querySelectorAll("[data-screen-panel]");

  buttons.forEach(function (button) {
    var screenName = button.getAttribute("data-screen");
    button.id = "tab-" + screenName;
    button.setAttribute("aria-controls", "panel-" + screenName);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", "false");
  });

  panels.forEach(function (panel) {
    var panelName = panel.getAttribute("data-screen-panel");
    panel.id = "panel-" + panelName;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "tab-" + panelName);
  });

  var isTransitioning = false;

  function openScreen(name) {
    if (isTransitioning) return;

    var currentPanel = root.querySelector(".dnp-screen.is-visible");
    var targetPanel = root.querySelector('[data-screen-panel="' + name + '"]');
    if (!targetPanel) return;

    if (layout) {
      if (name === "database") {
        layout.classList.add("is-terminal-mode");
      } else {
        layout.classList.remove("is-terminal-mode");
      }
    }

    if (currentPanel && currentPanel !== targetPanel) {
      isTransitioning = true;
      var curHead = currentPanel.querySelector(".dnp-screen-head");

      if (curHead) {
        curHead.classList.remove("head-slide-in");
        curHead.classList.add("head-slide-out");
      }

      setTimeout(function () {
        try {
          panels.forEach(function (panel) {
            var isActive = panel === targetPanel;
            panel.classList.toggle("is-visible", isActive);
            if (isActive) {
              panel.removeAttribute("aria-hidden");
            } else {
              panel.setAttribute("aria-hidden", "true");
            }
          });

          if (curHead) {
            curHead.classList.remove("head-slide-out");
          }

          var newHead = targetPanel.querySelector(".dnp-screen-head");
          if (newHead) {
            newHead.classList.remove("head-slide-in");
            void newHead.offsetWidth;
            newHead.classList.add("head-slide-in");
          }

          var newContent = targetPanel.querySelector(".dnp-screen-content");
          if (newContent) {
            newContent.classList.remove("dnp-flicker-1", "dnp-flicker-2", "dnp-flicker-3", "dnp-no-flicker");
            void newContent.offsetWidth;
            newContent.classList.add("dnp-no-flicker");
          }

          buttons.forEach(function (button) {
            var isActive = button.getAttribute("data-screen") === name;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", isActive ? "true" : "false");
          });

          if (name === "database") {
            initTerminalBoot();
          }
        } finally {
          isTransitioning = false;
        }
      }, 180);
    } else {
      panels.forEach(function (panel) {
        var isActive = panel === targetPanel;
        panel.classList.toggle("is-visible", isActive);
      });

      buttons.forEach(function (button) {
        var isActive = button.getAttribute("data-screen") === name;
        button.classList.toggle("is-active", isActive);
      });

      if (name === "database") {
        initTerminalBoot();
      }
    }
  }

  root.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-screen]");
    if (trigger && !trigger.disabled) {
      var screenName = trigger.getAttribute("data-screen");
      openScreen(screenName);
    }
  });

  var firstButton = root.querySelector('[data-screen].is-active') || root.querySelector('[data-screen]:not([disabled])');
  if (firstButton) {
    openScreen(firstButton.getAttribute("data-screen"));
  }

  // ==========================================
  // ПОВРЕЖДЕННЫЙ СЕКТОР КОРНИ
  // ==========================================
  var corruptModule = document.getElementById("corrupt-module");
  var corruptImg = document.getElementById("corrupt-img");
  var ghostTitle = document.getElementById("ghost-title");
  var slice1 = document.querySelector(".dnp-slice-1");
  var slice2 = document.querySelector(".dnp-slice-2");
  var sliceLog = document.querySelector(".dnp-slice-log");
  var slice3 = document.querySelector(".dnp-slice-3");

  if (corruptModule) {
    corruptModule.addEventListener("mousemove", function (e) {
      var rect = corruptModule.getBoundingClientRect();
      var xNorm = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      var yNorm = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      if (corruptImg) corruptImg.style.transform = "translate(" + (xNorm * 10).toFixed(1) + "px, " + (yNorm * 6).toFixed(1) + "px)";
      if (ghostTitle) ghostTitle.style.transform = "translate(" + (-xNorm * 14 - 10).toFixed(1) + "px, " + (-yNorm * 8 - 4).toFixed(1) + "px)";
      if (slice1) slice1.style.transform = "translate(" + (xNorm * 6).toFixed(1) + "px, " + (yNorm * 3).toFixed(1) + "px)";
      if (slice2) slice2.style.transform = "translate(" + (-xNorm * 8 + 4).toFixed(1) + "px, " + (-yNorm * 4).toFixed(1) + "px) skewX(" + (-xNorm * 1.5).toFixed(1) + "deg)";
      if (sliceLog) sliceLog.style.transform = "translateX(" + (xNorm * 5).toFixed(1) + "px)";
      if (slice3) slice3.style.transform = "translate(" + (-xNorm * 4).toFixed(1) + "px, " + (yNorm * 2).toFixed(1) + "px)";
    });

    corruptModule.addEventListener("mouseleave", function () {
      if (corruptImg) corruptImg.style.transform = "translate(0, 0)";
      if (ghostTitle) ghostTitle.style.transform = "translate(-10px, -4px)";
      if (slice1) slice1.style.transform = "translate(0, 0)";
      if (slice2) slice2.style.transform = "translate(5px, 0) skewX(-1deg)";
      if (sliceLog) sliceLog.style.transform = "translate(0, 0)";
      if (slice3) slice3.style.transform = "translate(0, 0)";
    });
  }

  // ==========================================
  // ТЕРМИНАЛ
  // ==========================================
  var sheetsUrl = "https://docs.google.com/spreadsheets/d/1IHAdgvHB27iW4s9aJe4L0GIpYrhS_R2EonUwugZIJww/edit?gid=601978163#gid=601978163";

  var asciiLogo = [
    "    @@                                                        @@    ",
    "     @                                                         %     ",
    "      %   @@ @@@ @@%@@@@@@ %@ @@@@@@@@@@@ @@ @@@@@@@@@@@@ @%@@@@@@@@@@          ",
    "       %   @@@@@%@ @@@@@@@ @%@@  @   @ @@@@ @@ @@@@@@@@@@@ @@@@@@@@@            ",
    "            @@@@@@@  @@@@@ @@@@@                 @@ @@@@ @@@ @@@@@@             ",
    "              @@@@@@%  @@@@@@@@ @@@@         @@@@@@@@@@@@ @@@@ @@@   %          ",
    "           @   @@@@@@@%@@@@@@@@@@@@@%       @@@@@@ @@ @ @@@@@@ @@   @           ",
    "            @   @@@%%@%@@@@@   @@@@@    @@@@@@@@@@@@ @@@@@@%@@@@   @            ",
    "             @   @@@% @@ @@@@@ @@@@@        @@@@@@@@@@ @%@@ @ @                 ",
    "              %   %@@@@@@@ @@@@%@@@@@       @@@@@@  %@@@%@@@@@                  ",
    "                    @@@@ @@@@@@@@@@@@      @@@@@@@@@@@@@@@@@@                   ",
    "                      @ %@%@% %@@   @%      @@ %@%%%%%%   @                     ",
    "                                                                                ",
    "        @@@@@@@ @@@@@@ @@ @@@  @@ @@@@@@@@ @@@@@@@@@ @@@@@@%  @@@   @@@@@@       ",
    "        @@   @@@@@@@@  @@ @@@@%@@ @@    @@ @@@@@@@@@ @@   @@ @@ @@  @@@@@       ",
    "        @@   @@ @@     @@ @@ @@@@ @@@  @@@ @@@@  @@@ @@  @@@@@@@@@@ @@           ",
    "        @@@@@@  @@@@@@ @@ @@   @@  @@@@@@  @@    @@@ @@@@@@ @@   @@@@@@@@@       ",
    "                                                                                ",
    "              @    @%     @     @@    @     @    @@    @    @     @             ",
    "                          @   @@@@@@@@@@  @@@@ @@@                              ",
    "                           @   @%@@@@      @@@@@@   @                           ",
    "                            @   @ @@@@ @  @@@@@@                                ",
    "                             %   @ @@@    @@ @@                                 ",
    "                                  %@@@@   @@@                                   ",
    "                                   @@@@ @@                                      ",
    "                                 %   @ @@@@                                     ",
    "                                 @   @@@@                                       ",
    "                                  @   @@   @                                    ",
    "                                   %                                            ",
    "                                                                                ",
    "                                       @@                                       "
  ].join("\n");

  window.employeeDb = {
    "xxartemrtxxx": { name: "xxartemrtxxx", title: "Лидер инженеров", rank: "Офицер", mp: "0/0", hours: "18:00", equipment: "42", coins: "42", activity: "0", quota_status: "ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "N/A", promotion: "Максимальное звание", lectures: { po: "ПРОЙДЕНА", so: "ПРОЙДЕНА", mp: "ПРОЙДЕНА" }, exams: { c: "СДАНА", b: "СДАНА", a: "СДАНА" } },
    "egorik0130": { name: "EGORIK0130", title: "Аналитик инженеров", rank: "Офицер", mp: "0/0", hours: "24:00", equipment: "126", coins: "126", activity: "0", quota_status: "ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "N/A", promotion: "Максимальное звание", lectures: { po: "ПРОЙДЕНА", so: "ПРОЙДЕНА", mp: "ПРОЙДЕНА" }, exams: { c: "СДАНА", b: "СДАНА", a: "СДАНА" } },
    "ceretow2222": { name: "ceretow2222", title: "Профессор инженеров", rank: "A RANK", mp: "0/0", hours: "14:00", equipment: "0", coins: "0", activity: "0", quota_status: "ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "N/A", promotion: "Максимальное звание", lectures: { po: "ПРОЙДЕНА", so: "ПРОЙДЕНА", mp: "НЕ ПРОЙДЕНА" }, exams: { c: "СДАНА", b: "СДАНА", a: "СДАНА" } },
    "zzmalf4": { name: "zzmalf4", title: "Главный инженер", rank: "A RANK", mp: "0/1", hours: "0:00", equipment: "0", coins: "46", activity: "0", quota_status: "НЕ ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "Кэнсэки 1", promotion: "ПРИОСТАНОВЛЕНО (Действуют дисциплинарные взыскания)", lectures: { po: "НЕ ПРОЙДЕНА", so: "НЕ ПРОЙДЕНА", mp: "НЕ ПРОЙДЕНА" }, exams: { c: "НЕ СДАНА", b: "НЕ СДАНА", a: "НЕ СДАНА" } },
    "wewewewestrelok": { name: "Wewewewestrelok", title: "Первоиздатель", rank: "Офицер", mp: "—", hours: "—", equipment: "—", coins: "—", activity: "—", quota_status: "ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "N/A", promotion: "Максимальное звание", lectures: { po: "ПРОЙДЕНА", so: "ПРОЙДЕНА", mp: "ПРОЙДЕНА" }, exams: { c: "СДАНА", b: "СДАНА", a: "СДАНА" } }
  };

  function getCurrentUser() {
    var user = localStorage.getItem("dnp_active_user");
    if (user) {
      try {
        var parsed = JSON.parse(user);
        if (parsed && parsed.username) return parsed.username.toUpperCase();
      } catch (e) {}
    }
    return "USER";
  }

  function getPromptStr() {
    return 'D:\\"' + getCurrentUser() + '">';
  }

  window.renderAuthHeader = function () {
    var slot = document.getElementById("dnp-auth-header-slot");
    if (!slot) return;

    var rawUser = localStorage.getItem("dnp_active_user");
    if (rawUser) {
      try {
        var u = JSON.parse(rawUser);
        slot.innerHTML = [
          '<div class="dnp-user-pill" id="dnp-user-pill">',
          '  <div class="dnp-user-avatar">' + (u.username ? u.username[0].toUpperCase() : 'U') + '</div>',
          '  <span class="dnp-user-name">' + (u.username || 'OPERATOR') + '</span>',
          '</div>',
          '<div class="dnp-user-dropdown" id="dnp-user-dropdown" style="display: none;">',
          '  <div class="dnp-dropdown-item" id="dnp-menu-profile">Профиль (' + (u.roblox || 'N/A') + ')</div>',
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

    slot.innerHTML = '<a href="auth.html" class="dnp-auth-btn" id="dnp-auth-link">ЛИЧНЫЙ КАБИНЕТ</a>';
  };

  window.addEventListener("DOMContentLoaded", window.renderAuthHeader);

  var termLoaded = false;
  var termBooting = false;
  var termStep = 0;
  var termTimer = null;
  var cmdHistory = [];
  var cmdHistoryIndex = -1;

  function initTerminalBoot() {
    var termTopTitle = document.getElementById("term-top-title");
    var termProgressLine = document.getElementById("term-progress-line");
    var termAscii = document.getElementById("term-ascii");
    var termPromptLine = document.getElementById("term-prompt-line");
    var termPromptLabel = document.getElementById("term-prompt-label");
    var termInput = document.getElementById("term-input");

    if (termPromptLabel) {
      termPromptLabel.textContent = getPromptStr();
    }

    if (termLoaded || termBooting) {
      if (termInput) termInput.focus({ preventScroll: true });
      return;
    }
    termBooting = true;
    termStep = 0;

    if (termTopTitle) termTopTitle.textContent = "LOADING .  .  . PLEASE WAIT";
    if (termProgressLine) termProgressLine.textContent = "▶ CURRENT PROGRESS . . . [ • • • • • • • • • • • • • • • • • • • • ]";
    if (termAscii) termAscii.style.display = "none";
    if (termPromptLine) termPromptLine.style.display = "none";

    runBootStep();
  }

  function runBootStep() {
    var termProgressLine = document.getElementById("term-progress-line");
    var totalDots = 20;
    var filled = Math.min(termStep * 2, totalDots);
    var str = "[ ";
    for (var i = 0; i < filled; i++) str += "▉ ";
    for (var j = filled; j < totalDots; j++) str += "• ";
    str += "]";

    if (termProgressLine) {
      termProgressLine.textContent = "▶ CURRENT PROGRESS . . . " + str;
    }

    if (termStep >= 10) {
      finishTerminalBoot();
      return;
    }

    termStep++;
    termTimer = setTimeout(runBootStep, 100);
  }

  function finishTerminalBoot() {
    if (termTimer) clearTimeout(termTimer);
    termBooting = false;
    termLoaded = true;

    var termTopTitle = document.getElementById("term-top-title");
    var termProgressLine = document.getElementById("term-progress-line");
    var termAscii = document.getElementById("term-ascii");
    var termPromptLine = document.getElementById("term-prompt-line");
    var termPromptLabel = document.getElementById("term-prompt-label");
    var termInput = document.getElementById("term-input");

    if (termTopTitle) termTopTitle.textContent = "WELCOME TO DEINOPIDAE INDUSTRIES";
    if (termProgressLine) termProgressLine.textContent = '▶ LOAD COMPLETE, TYPE "HELP" FOR SEE HELP';

    if (termAscii) {
      termAscii.textContent = asciiLogo;
      termAscii.style.display = "block";
    }

    if (termPromptLabel) {
      termPromptLabel.textContent = getPromptStr();
    }

    if (termPromptLine) {
      termPromptLine.style.display = "flex";
    }
    if (termInput) {
      termInput.focus({ preventScroll: true });
    }
  }

  var termBody = document.getElementById("term-body");
  if (termBody) {
    termBody.addEventListener("click", function () {
      if (termBooting) {
        finishTerminalBoot();
      } else {
        var input = document.getElementById("term-input");
        if (input) input.focus({ preventScroll: true });
      }
    });
  }

  function scrollTerm() {
    var b = document.getElementById("term-body");
    if (b) b.scrollTop = b.scrollHeight;
  }

  function printLine(text) {
    var termOutput = document.getElementById("term-output");
    if (!termOutput) return;
    var div = document.createElement("div");
    div.className = "dnp-term-resp-line";
    div.innerHTML = text;
    termOutput.appendChild(div);
    scrollTerm();
  }

  function executeCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) return;

    cmdHistory.push(cmd);
    cmdHistoryIndex = cmdHistory.length;

    var currentPrompt = getPromptStr();
    printLine(currentPrompt + " " + cmd);

    var parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    var first = (parts[0] || "").toUpperCase();

    if (first === "HELP") {
      printLine("HELP                - Вызов списка доступных команд");
      printLine("STAFF &lt;никнейм&gt;     - Личное дело сотрудника");
      printLine("FIND \"фраза\"        - Поиск данных");
      printLine("CLS / CLEAR         - Очистить терминал");
      return;
    }

    if (first === "STAFF") {
      var nick = (parts[1] || "").replace(/^"|"$/g, "").toLowerCase();
      if (!nick) {
        printLine("Синтаксис: STAFF &lt;никнейм&gt;");
        return;
      }

      var db = window.employeeDb || {};
      var p = db[nick];

      if (p) {
        printLine("=== [ЛИЧНОЕ ДЕЛО СОТРУДНИКА // DEINOPIDAE] ===");
        printLine("  ПОЗЫВНОЙ / НИК    : " + p.name);
        printLine("  ЗВАНИЕ / РАНГ     : " + p.title + " [" + p.rank + "]");
        printLine("  НОРМАТИВ          : МП: " + p.mp + " | Часы: " + p.hours + " | Оборудование: " + p.equipment);
        printLine("  СТАТУС НОРМЫ      : " + p.quota_status);
        printLine("  ПОВЫШЕНИЕ         : " + p.promotion);
        printLine("  ОТПУСК            : " + p.vacation);
        printLine("  НАКАЗАНИЯ         : " + p.penalties);
        printLine("  АКТИВ / КОЙНЫ     : Хихикойны: " + p.coins + " | Очки активности: " + p.activity);
        printLine("==============================================");
      } else {
        printLine("Позывной '" + nick + "' не найден в локальном реестре.");
        printLine("Ведомость: <span class='dnp-term-link' onclick='window.open(\"" + sheetsUrl + "\",\"_blank\")'>ОТКРЫТЬ ТАБЛИЦУ ↗</span>");
      }
      return;
    }

    if (first === "FIND") {
      var query = (parts.slice(1).join(" ") || "").replace(/^"|"$/g, "").toLowerCase();
      if (!query) {
        printLine("Синтаксис: FIND \"фраза\"");
        return;
      }
      var db2 = window.employeeDb || {};
      var matches = [];
      Object.keys(db2).forEach(function (k) {
        var emp = db2[k];
        var rawStr = (emp.name + " " + emp.rank + " " + (emp.title || "")).toLowerCase();
        if (rawStr.indexOf(query) !== -1) {
          matches.push("[СОСТАВ] " + emp.name + " // " + emp.title + " [" + emp.rank + "] - Норма: " + emp.quota_status);
        }
      });
      if (matches.length > 0) {
        matches.forEach(function (m) { printLine("  • " + m); });
      } else {
        printLine("По запросу \"" + query + "\" данных не обнаружено.");
      }
      return;
    }

    if (first === "CLS" || first === "CLEAR") {
      var termOutput = document.getElementById("term-output");
      if (termOutput) termOutput.innerHTML = "";
      return;
    }

    printLine('Команда "' + cmd + '" не распознана. Введите "HELP" для справки.');
  }

  var termInput = document.getElementById("term-input");
  var termTyped = document.getElementById("term-typed");

  if (termInput) {
    termInput.addEventListener("input", function () {
      if (termTyped) termTyped.textContent = termInput.value;
    });

    termInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var val = termInput.value;
        termInput.value = "";
        if (termTyped) termTyped.textContent = "";
        executeCommand(val);
      } else if (e.key === "ArrowUp") {
        if (cmdHistory.length > 0 && cmdHistoryIndex > 0) {
          cmdHistoryIndex--;
          termInput.value = cmdHistory[cmdHistoryIndex];
          if (termTyped) termTyped.textContent = termInput.value;
        }
      } else if (e.key === "ArrowDown") {
        if (cmdHistoryIndex < cmdHistory.length - 1) {
          cmdHistoryIndex++;
          termInput.value = cmdHistory[cmdHistoryIndex];
          if (termTyped) termTyped.textContent = termInput.value;
        } else {
          cmdHistoryIndex = cmdHistory.length;
          termInput.value = "";
          if (termTyped) termTyped.textContent = "";
        }
      }
    });
  }
})();