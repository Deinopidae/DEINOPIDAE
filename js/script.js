(function () {
  var loader = document.getElementById("dnp-loader");
  var loaderBar = document.getElementById("loader-bar");
  var loaderPercent = document.getElementById("loader-percent");
  var loaderPin = document.getElementById("loader-pin");
  var loaderBg = document.getElementById("loader-bg");
  var loaderWipe = document.getElementById("loader-wipe");
  var loaderContent = document.getElementById("loader-content");

  if (loader && loaderBar && loaderPercent && loaderPin && loaderBg && loaderWipe) {
    var targetProgress = 15;
    var currentProgress = 0;
    var isFullyLoaded = false;
    var isFinished = false;

    if (document.readyState === "interactive" || document.readyState === "complete") {
      targetProgress = Math.max(targetProgress, 40);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        targetProgress = Math.max(targetProgress, 40);
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        targetProgress = Math.max(targetProgress, 60);
      });
    }

    var assets = [].concat(
      Array.from(document.images || []),
      Array.from(document.querySelectorAll("iframe") || [])
    );

    var totalAssets = assets.length;
    var loadedAssets = 0;

    function onAssetDone() {
      loadedAssets++;
      if (totalAssets > 0) {
        var mediaPortion = (loadedAssets / totalAssets) * 30;
        targetProgress = Math.max(targetProgress, Math.round(60 + mediaPortion));
      }
    }

    if (totalAssets > 0) {
      assets.forEach(function (el) {
        if (el.complete || el.readyState === "complete") {
          onAssetDone();
        } else {
          el.addEventListener("load", onAssetDone, { once: true });
          el.addEventListener("error", onAssetDone, { once: true });
        }
      });
    } else {
      targetProgress = Math.max(targetProgress, 85);
    }

    if (document.readyState === "complete") {
      targetProgress = 100;
      isFullyLoaded = true;
    } else {
      window.addEventListener("load", function () {
        targetProgress = 100;
        isFullyLoaded = true;
      });
    }

    setTimeout(function () {
      targetProgress = 100;
      isFullyLoaded = true;
    }, 6000);

    function renderLoader() {
      if (currentProgress < targetProgress) {
        var step = (targetProgress - currentProgress) * 0.12;
        currentProgress += Math.max(0.35, step);
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

      if (currentProgress >= 100 && (isFullyLoaded || targetProgress === 100)) {
        if (!isFinished) {
          isFinished = true;
          completeLoadingSequence();
        }
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
            }, 300);
          }, 480);
        }, 500);
      }, 250);
    }

    requestAnimationFrame(renderLoader);
  }

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

            var willFlicker = Math.random() < 0.6;
            if (willFlicker) {
              var blinks = Math.floor(Math.random() * 3) + 1;
              newContent.classList.add("dnp-flicker-" + blinks);
            } else {
              newContent.classList.add("dnp-no-flicker");
            }
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
      }, 240);
    } else {
      panels.forEach(function (panel) {
        var isActive = panel === targetPanel;
        panel.classList.toggle("is-visible", isActive);
        if (isActive) {
          panel.removeAttribute("aria-hidden");
        } else {
          panel.setAttribute("aria-hidden", "true");
        }
      });

      buttons.forEach(function (button) {
        var isActive = button.getAttribute("data-screen") === name;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
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

      if (corruptImg) {
        corruptImg.style.transform = "translate(" + (xNorm * 10).toFixed(1) + "px, " + (yNorm * 6).toFixed(1) + "px)";
      }
      if (ghostTitle) {
        ghostTitle.style.transform = "translate(" + (-xNorm * 14 - 10).toFixed(1) + "px, " + (-yNorm * 8 - 4).toFixed(1) + "px)";
      }
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

  // =========================================================
  // ТЕРМИНАЛ: ЧИСТЫЙ КОМАНДНЫЙ ИНТЕРФЕЙС
  // =========================================================
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
    "zzmalf4": { name: "zzmalf4", title: "Главный инженер", rank: "A RANK", mp: "0/1", hours: "0:00", equipment: "0", coins: "46", activity: "0", quota_status: "НЕ ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "Кэнсэки 1", promotion: "ПРИОСТАНОВЛЕНО (Действуют активные дисциплинарные взыскания)", lectures: { po: "НЕ ПРОЙДЕНА", so: "НЕ ПРОЙДЕНА", mp: "НЕ ПРОЙДЕНА" }, exams: { c: "НЕ СДАНА", b: "НЕ СДАНА", a: "НЕ СДАНА" } },
    "wewewewestrelok": { name: "Wewewewestrelok", title: "Первоиздатель", rank: "Офицер", mp: "—", hours: "—", equipment: "—", coins: "—", activity: "—", quota_status: "ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "N/A", promotion: "Максимальное звание", lectures: { po: "ПРОЙДЕНА", so: "ПРОЙДЕНА", mp: "ПРОЙДЕНА" }, exams: { c: "СДАНА", b: "СДАНА", a: "СДАНА" } }
  };

  var envVars = {
    "OS": "Deinopidae Terminal OS [Build 2026.4]",
    "DRIVE": "D:\\",
    "SYSTEM_NODE": "DEINOPIDAE S.E. // CORE",
    "TERMINAL_STATUS": "ACTIVE"
  };

  function getCurrentUser() {
    if (window.CookieManager) {
      var tok = window.CookieManager.get('dnp_username');
      if (tok) return tok.toUpperCase();
    }
    return "USER";
  }

  function getPromptStr() {
    return 'D:\\"' + getCurrentUser() + '">';
  }

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
    termTimer = setTimeout(runBootStep, 180);
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
        if (window.getSelection && window.getSelection().toString().length > 0) return;
        var input = document.getElementById("term-input");
        if (input && document.activeElement !== input) {
          input.focus({ preventScroll: true });
        }
      }
    });
  }

  function scrollTerm() {
    var b = document.getElementById("term-body");
    if (b) {
      b.scrollTop = b.scrollHeight;
    }
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

    // Убираем префикс D если пользователь случайно его ввёл
    if (first === "D" && parts.length > 1) {
      parts.shift();
      first = (parts[0] || "").toUpperCase();
    }

    if (first === "HELP") {
      printLine("HELP                - Вызов списка доступных команд");
      printLine("STAFF &lt;никнейм&gt;     - Личное дело и статус сотрудника");
      printLine("FIND \"фраза\"        - Поиск данных");
      printLine("FIND STAFF \"фраза\"  - Поиск данных по сотруднику");
      printLine("TABLE               - Вызов Google Таблицы");
      printLine("SET                 - Переменные окружения");
      printLine("TITLE &lt;текст&gt;       - Изменить заголовок окна");
      printLine("VER                 - Версия системы");
      printLine("DATE                - Системная дата");
      printLine("TIME                - Системное время");
      printLine("ECHO &lt;текст&gt;        - Вывод текста в консоль");
      printLine("WHOAMI              - Имя текущего пользователя");
      printLine("HOSTNAME            - Сетевое имя устройства");
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
        printLine("=== [ЛИЧНОЕ ДЕЛО СОТРУДНИКА // COMPLEX DEINOPIDAE] ===");
        printLine("  ПОЗЫВНОЙ / НИК    : " + p.name);
        printLine("  ЗВАНИЕ / РАНГ     : " + p.title + " [" + p.rank + "]");
        printLine("  НОРМАТИВ          : МП: " + p.mp + " | Часы: " + p.hours + " | Оборудование: " + p.equipment);
        printLine("  СТАТУС НОРМЫ      : " + p.quota_status);
        printLine("  ПОВЫШЕНИЕ         : " + p.promotion);
        printLine("  ОТПУСК            : " + p.vacation);
        if (p.lectures) {
          printLine("  ЛЕКЦИИ            : ПО: " + p.lectures.po + " | СО: " + p.lectures.so + " | МП: " + p.lectures.mp);
        }
        if (p.exams) {
          printLine("  ПРОВЕРКИ          : C: " + p.exams.c + " | B: " + p.exams.b + " | A: " + p.exams.a);
        }
        printLine("  НАКАЗАНИЯ         : " + p.penalties);
        printLine("  АКТИВ / КОЙНЫ     : Хихикойны: " + p.coins + " | Очки активности: " + p.activity);
        printLine("======================================================");
      } else {
        printLine("Позывной '" + nick + "' не найден в локальном реестре.");
        printLine("Ведомость доступна по ссылке: <span class='dnp-term-link' onclick='window.open(\"" + sheetsUrl + "\",\"_blank\")'>ОТКРЫТЬ ТАБЛИЦУ DEINOPIDAE ↗</span>");
      }
      return;
    }

    if (first === "FIND") {
      var isStaffOnly = (parts[1] || "").toUpperCase() === "STAFF";
      var queryIdx = isStaffOnly ? 2 : 1;
      var query = (parts.slice(queryIdx).join(" ") || "").replace(/^"|"$/g, "").toLowerCase();

      if (!query) {
        printLine("Синтаксис: FIND \"фраза\" или FIND STAFF \"фраза\"");
        return;
      }

      var db = window.employeeDb || {};
      var matches = [];

      Object.keys(db).forEach(function (k) {
        var emp = db[k];
        var rawStr = (emp.name + " " + emp.rank + " " + (emp.title || "") + " " + (emp.penalties || "")).toLowerCase();
        if (rawStr.indexOf(query) !== -1) {
          matches.push("[СОСТАВ] " + emp.name + " // " + emp.title + " [" + emp.rank + "] - Норма: " + emp.quota_status);
        }
      });

      if (matches.length > 0) {
        matches.forEach(function (m) {
          printLine("  • " + m);
        });
        printLine("Найдено записей: " + matches.length);
      } else {
        printLine("По запросу \"" + query + "\" данных не обнаружено.");
      }
      return;
    }

    if (first === "TABLE") {
      window.open(sheetsUrl, "_blank");
      printLine("Google Таблица состава открыта в новом окне браузера.");
      return;
    }

    if (first === "SET") {
      Object.keys(envVars).forEach(function (k) {
        printLine(k + "=" + envVars[k]);
      });
      printLine("USER=" + getCurrentUser());
      return;
    }

    if (first === "TITLE") {
      var newTitle = cmd.substring(5).trim();
      var topTitle = document.getElementById("term-top-title");
      if (newTitle && topTitle) {
        topTitle.textContent = newTitle;
        printLine("Заголовок окна обновлен.");
      } else {
        printLine("Синтаксис: TITLE &lt;текст&gt;");
      }
      return;
    }

    if (first === "VER") {
      printLine("Deinopidae Terminal OS [Версия 4.10.88 - 2026]");
      return;
    }

    if (first === "DATE") {
      printLine("Текущая дата: " + new Date().toLocaleDateString());
      return;
    }

    if (first === "TIME") {
      printLine("Текущее время: " + new Date().toLocaleTimeString());
      return;
    }

    if (first === "WHOAMI") {
      printLine('D:\\"' + getCurrentUser() + '"');
      return;
    }

    if (first === "HOSTNAME") {
      printLine("SE-DNP-NODE04-COMPLEX");
      return;
    }

    if (first === "ECHO") {
      var echoMsg = cmd.substring(4).trim();
      printLine(echoMsg);
      return;
    }

    if (first === "CLS" || first === "CLEAR") {
      var termOutput = document.getElementById("term-output");
      if (termOutput) termOutput.innerHTML = "";
      return;
    }

    printLine('Команда "' + cmd + '" не распознана. Введите "HELP" для списка команд.');
  }

  var termInput = document.getElementById("term-input");
  if (termInput) {
    termInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var val = termInput.value;
        termInput.value = "";
        executeCommand(val);
      } else if (e.key === "ArrowUp") {
        if (cmdHistory.length > 0 && cmdHistoryIndex > 0) {
          cmdHistoryIndex--;
          termInput.value = cmdHistory[cmdHistoryIndex];
        }
      } else if (e.key === "ArrowDown") {
        if (cmdHistoryIndex < cmdHistory.length - 1) {
          cmdHistoryIndex++;
          termInput.value = cmdHistory[cmdHistoryIndex];
        } else {
          cmdHistoryIndex = cmdHistory.length;
          termInput.value = "";
        }
      }
    });
  }
})();