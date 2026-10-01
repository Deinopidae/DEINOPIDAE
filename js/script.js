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

    if (currentPanel && currentPanel !== targetPanel) {
      isTransitioning = true;
      var curHead = currentPanel.querySelector(".dnp-screen-head");

      if (curHead) {
        curHead.classList.remove("head-slide-in");
        curHead.classList.add("head-slide-out");
      }

      setTimeout(function () {
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

        isTransitioning = false;
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
  // КОМАНДНАЯ СТРОКА: БАЗА ДАННЫХ И ТЕРМИНАЛ DEINOPIDAE
  // =========================================================
  var termBody = document.getElementById("term-body");
  var termTopTitle = document.getElementById("term-top-title");
  var termProgressLine = document.getElementById("term-progress-line");
  var termMsgSys = document.getElementById("term-msg-sys");
  var termMsgTip = document.getElementById("term-msg-tip");
  var termAscii = document.getElementById("term-ascii");
  var termOutput = document.getElementById("term-output");
  var termPromptLine = document.getElementById("term-prompt-line");
  var termInput = document.getElementById("term-input");

  var brudUrl = "https://docs.google.com/document/d/1E0ettcqE--eQjUvUlX4ZIv9UmGBjjXD7QLfmqlYDgAE/edit?usp=sharing";
  var sheetsUrl = "https://docs.google.com/spreadsheets/d/1IHAdgvHB27iW4s9aJe4L0GIpYrhS_R2EonUwugZIJww/edit?gid=601978163#gid=601978163";

  var asciiLogo = [
    "             /\\                                  /\\",
    "            /  \\                                /  \\",
    "           / /\\ \\                              / /\\ \\",
    "          / /  \\ \\       DEINOPIDAE           / /  \\ \\",
    "         / / /\\ \\ \\      INDUSTRIES          / / /\\ \\ \\",
    "        / / /  \\ \\ \\                        / / /  \\ \\ \\",
    "       / / / /\\ \\ \\ \\     [S.E. CORE]      / / / /\\ \\ \\ \\",
    "      / / / /__\\ \\ \\ \\                    / / / /__\\ \\ \\ \\",
    "     / / /   ||   \\ \\ \\                  / / /   ||   \\ \\ \\",
    "    / / /====||====\\ \\ \\                / / /====||====\\ \\ \\",
    "   /        [||]        \\              /        [||]        \\",
    "  /__________||__________\\            /__________||__________\\",
    "            [||]                                [||]"
  ].join("\n");

  var employeeDb = {
    "xxartemrtxxx": { name: "xxartemrtxxx", rank: "OFFICER", role: "Офицер отдела", hours: "18 ч.", po: 6, so: 4, ikoku: 0, kenseki: 0, status: "АКТИВЕН // В СТРОЮ" },
    "egorik0130": { name: "EGORIK0130", rank: "OFFICER", role: "Офицер отдела", hours: "24 ч.", po: 8, so: 5, ikoku: 0, kenseki: 0, status: "АКТИВЕН // В СТРОЮ" },
    "ceretow2222": { name: "ceretow2222", rank: "PROFESSOR", role: "Профессор", hours: "14 ч.", po: 4, so: 3, ikoku: 0, kenseki: 0, status: "АКТИВЕН // В СТРОЮ" },
    "zzmalf4": { name: "zzmalf4", rank: "PROFESSOR", role: "Профессор", hours: "16 ч.", po: 5, so: 2, ikoku: 0, kenseki: 0, status: "АКТИВЕН // В СТРОЮ" },
    "wewewewestrelok": { name: "Wewewewestrelok", rank: "OFFICER", role: "Первоиздатель", hours: "—", po: "—", so: "—", ikoku: 0, kenseki: 0, status: "АРХИВ // ПОЧЁТНЫЙ" },
    "kira_ewika": { name: "kira_ewika", rank: "PROFESSOR", role: "Экс-профессор", hours: "—", po: "—", so: "—", ikoku: 1, kenseki: 0, status: "АРХИВ" }
  };

  var directories = {
    "устав": [
      "РАЗДЕЛ 1: Основа (О предприятии, задачи работы)",
      "РАЗДЕЛ 2: Правила (КВР, Свод законов, виды наказаний: Устный, Икоку, Кенсэки)",
      "РАЗДЕЛ 3: Повышения (Звания: Курсант -> Главный инженер, потолок рангов)",
      "РАЗДЕЛ 4: Норма (Еженедельная норма: Кадет, C, B, A ранги)",
      "РАЗДЕЛ 5: Задания (РП-задачи для проверки рангов: WHEEL, POWER, LIGHT и др.)",
      "РАЗДЕЛ 6: Проверки и Лекции (Экзамены C/B/A, лекции ПО/СО/МП)",
      "РАЗДЕЛ 7: Активности (Шкала прогрессии, сброс очков по понедельникам)",
      "РАЗДЕЛ 8: Прочее (Проведение мероприятий: 5 и 7 звания)",
      "РАЗДЕЛ 9: Конец (Заключение, первоиздатель Wewewewestrelok)"
    ],
    "бруд": [
      "БРУД // Документ: " + brudUrl,
      "01. Положения и регламент предприятия Deinopidae",
      "02. Квалификационные требования и должностные инструкции",
      "03. Журнал внеурочной деятельности и отписка-нормы"
    ],
    "звания": [
      "Кадет: 1. Курсант (выдается аналитиком), 2. Локализатор (5ч, 1 задание)",
      "C Rank: 3. Оператор (6ч, 2 задания, 6 дней), 4. Диспетчер (7ч, 2 задания, 8 дней)",
      "B Rank: 5. Полевой эксперт (8ч, 3 задания, 10 дней), 6. Старший инспектор (9ч, 3 задания, 18 дней)",
      "A Rank: 7. Ведущий конструктор (9ч, 4 задания, 23 дня), 8. Главный инженер (выдается аналитиком)"
    ],
    "норма": [
      "Кадет: Посетить 4 МП. На выбор: Наиграть 4 часа / 5 Оборудования",
      "C RANK: Посетить 3 МП. На выбор: Наиграть 3 часа / 4 Оборудования",
      "B RANK: Посетить 2 МП. На выбор: Наиграть 3 часа / 3 Оборудования",
      "A RANK: Посетить 2 МП. На выбор: Наиграть 2 часа / 2 Оборудования",
      "ШТРАФ: Невыполнение без отписки в 'Отписка-нормы' = 1 Кенсэки"
    ],
    "задания": [
      "Кадет: TASK 01 [WHEEL] (колесо тележки), TASK 02 [LOCKS] (замки шкафчиков)",
      "C ранг: TASK 01 [POWER] (пробки в щитке), TASK 02 [HVAC] (вентиляция), TASK 03 [ALARM] (тревога), TASK 04 [GLASS] (бронестекло)",
      "B ранг: TASK 01 [LIGHT] (прожектор), TASK 02 [LIFT] (подвесная система), TASK 03 [HAZMAT] (комбинезон), TASK 04 [WIRES] (кабель), TASK 05 [GATES] (гермоворота), TASK 06 [SEAL] (герметизация)",
      "A ранг: TASK 01 [MILITARY], TASK 02 [AUTOMATION], TASK 03 [BIOMECH], TASK 04 [EXOSKELETON]"
    ],
    "активности": [
      "LVL 0: Базовый (разблокирует C rank)",
      "LVL 1: Средний (разблокирует B rank, рейтинг, внеурочки)",
      "LVL 2: Высокий (разблокирует A rank, квесты)",
      "ПРАВИЛО: Под конец недели (0:00 ПН) при >= 20 очках снимается 20 PTS. При < 20 очках сброс на 1 уровень.",
      "БАЛЛЫ: Внеурочки (10), Квесты (20), Помощь (10), Рейтинг (10), Отдельное МП (10), Общее МП (20), Лекция (20), Норма (10)"
    ],
    "документы": [
      "Таблица состава: " + sheetsUrl,
      "БРУД (Регламент): " + brudUrl,
      "Внеурочки ПО: https://docs.google.com/document/d/1uE71cTVHOE3EuCvhobRR2kRhBRD6_jkZpuRtHyttJss/edit?tab=t.3eryletig9pf",
      "Внеурочки СО: https://docs.google.com/document/d/1uE71cTVHOE3EuCvhobRR2kRhBRD6_jkZpuRtHyttJss/edit?tab=t.dbweaooy075n",
      "Пользовательское соглашение: https://docs.google.com/document/d/19s4BciaStHnKUGiKVbS0_ZXwLyneFtL_1h7jKW1yjQc/edit?tab=t.3eryletig9pf",
      "Справочник сотрудника: https://docs.google.com/document/d/1tyOYPDDdCkR05MErbYVRTcsnkziUA5bxzr5-_I7G6Pk/edit?tab=t.3eryletig9pf"
    ]
  };

  var termLoaded = false;
  var termBooting = false;
  var termStep = 0;
  var termTimer = null;
  var cmdHistory = [];
  var cmdHistoryIndex = -1;

  function initTerminalBoot() {
    if (termLoaded || termBooting) {
      if (termInput) termInput.focus();
      return;
    }
    termBooting = true;
    termStep = 0;

    termTopTitle.textContent = "LOADING .  .  . PLEASE WAIT   読み込み中. . . 待って下さい";
    termProgressLine.textContent = "▶ CURRENT PROGRESS . . . [ • • • • • • • • • • • • • • • • • • • • ]";
    termMsgSys.style.display = "none";
    termMsgTip.style.display = "none";
    termAscii.style.display = "none";
    termPromptLine.style.display = "none";

    runBootStep();
  }

  function runBootStep() {
    var totalDots = 20;
    var filled = Math.min(termStep * 2, totalDots);
    var str = "[ ";
    for (var i = 0; i < filled; i++) str += "▉ ";
    for (var j = filled; j < totalDots; j++) str += "• ";
    str += "]";

    termProgressLine.textContent = "▶ CURRENT PROGRESS . . . " + str;

    if (termStep === 3) {
      termMsgSys.style.display = "block";
    }
    if (termStep === 6) {
      termMsgTip.style.display = "block";
    }

    if (termStep >= 10) {
      finishTerminalBoot();
      return;
    }

    termStep++;
    termTimer = setTimeout(runBootStep, 240);
  }

  function finishTerminalBoot() {
    if (termTimer) clearTimeout(termTimer);
    termBooting = false;
    termLoaded = true;

    termTopTitle.textContent = "WELCOME TO DEINOPIDAE INDUSTRIES";
    termProgressLine.textContent = '▶ LOAD COMPLETE, TYPE "D HELP" FOR SEE HELP';
    termMsgSys.style.display = "block";
    termMsgTip.style.display = "block";

    termAscii.textContent = asciiLogo;
    termAscii.style.display = "block";

    termPromptLine.style.display = "flex";
    if (termInput) {
      termInput.focus();
    }
    scrollTerm();
  }

  if (termBody) {
    termBody.addEventListener("click", function () {
      if (termBooting) {
        finishTerminalBoot();
      } else if (termInput) {
        termInput.focus();
      }
    });
  }

  function scrollTerm() {
    if (termBody) {
      termBody.scrollTop = termBody.scrollHeight;
    }
  }

  function printLine(text, className) {
    var div = document.createElement("div");
    div.className = "dnp-term-resp-line " + (className || "");
    div.innerHTML = text;
    termOutput.appendChild(div);
    scrollTerm();
  }

  function executeCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) return;

    cmdHistory.push(cmd);
    cmdHistoryIndex = cmdHistory.length;

    printLine("DNP:\\&gt; " + cmd, "dnp-term-cmd-echo");

    var parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    var first = (parts[0] || "").toUpperCase();

    // 1. Префикс D
    if (first === "D") {
      var sub = (parts[1] || "").toUpperCase();
      var arg1 = (parts[2] || "").replace(/^"|"$/g, "");
      var arg2 = (parts[3] || "").replace(/^"|"$/g, "");

      if (!sub || sub === "HELP") {
        printLine("=== [DEINOPIDAE OS // КОМАНДЫ БАЗЫ ДАННЫХ] ===");
        printLine("  D HELP                      - Вызов списка команд");
        printLine("  D DIR [директория]          - Просмотр содержимого директорий");
        printLine("  D FIND \"слово\" [директория]  - Поиск данных по реестру и уставу");
        printLine("  D STAFF &lt;никнейм&gt;           - Личное дело и досье сотрудника");
        printLine("  D OPEN &lt;раздел / ссылка&gt;    - Быстрый переход по узлам системы");
        printLine("  D TABLE                     - Прямой доступ к таблице состава");
        printLine("  D BRUD                      - Доступ к главному регламенту БРУД");
        printLine("  ECHO &lt;текст&gt;                - Вывод текста в консоль");
        printLine("  CLS / CLEAR                 - Очистить терминал");
        printLine("[TIP] Попробуйте написать: D DIR Устав или D STAFF EGORIK0130", "is-tip");
        return;
      }

      if (sub === "DIR") {
        var dirTarget = (arg1 || "").toLowerCase();
        if (!dirTarget) {
          printLine("[SYS] ДОСТУПНЫЕ ДИРЕКТОРИИ БАЗЫ ДАННЫХ:");
          printLine("  • УСТАВ        - Все 9 разделов действующего устава");
          printLine("  • БРУД         - Ссылки и разделы базового регламента");
          printLine("  • ЗВАНИЯ       - Квалификационные уровни и ранги");
          printLine("  • НОРМА        - Норматив часов и оборудования");
          printLine("  • ЗАДАНИЯ      - Список РП-квестов для повышений");
          printLine("  • АКТИВНОСТИ   - Баллы и прогрессия уровней");
          printLine("  • ДОКУМЕНТЫ    - Внеурочки, соглашение, справочники");
          printLine("[TIP] Используйте: D DIR <название_директории>", "is-tip");
          return;
        }

        if (directories[dirTarget]) {
          printLine("[SYS] СОДЕРЖИМОЕ ДИРЕКТОРИИ [" + dirTarget.toUpperCase() + "]:");
          directories[dirTarget].forEach(function (row) {
            printLine("  &gt; " + row);
          });
        } else {
          printLine("[SYS] ERROR: Директория '" + dirTarget + "' не найдена в файловой системе.", "is-err");
          printLine("[TIP] Введите D DIR для списка всех доступных каталогов.", "is-tip");
        }
        return;
      }

      if (sub === "FIND") {
        var query = (arg1 || "").toLowerCase();
        var scope = (arg2 || "").toLowerCase();

        if (!query) {
          printLine("[SYS] ERROR: Не указана фраза для поиска.", "is-err");
          printLine("[TIP] Синтаксис: D FIND \"фраза\" или D FIND \"фраза\" \"директория\"", "is-tip");
          return;
        }

        printLine("[SYS] СКАНИРОВАНИЕ ИНДЕКСА ПО ЗАПРОСУ: \"" + query + "\"...");
        var matches = [];

        Object.keys(directories).forEach(function (cat) {
          if (scope && scope !== cat) return;
          directories[cat].forEach(function (line) {
            if (line.toLowerCase().indexOf(query) !== -1) {
              matches.push("[" + cat.toUpperCase() + "] " + line);
            }
          });
        });

        // Поиск по сотрудникам
        Object.keys(employeeDb).forEach(function (k) {
          if (scope && scope !== "состав" && scope !== "сотрудники") return;
          var emp = employeeDb[k];
          var rawStr = (emp.name + " " + emp.rank + " " + emp.role + " " + emp.status).toLowerCase();
          if (rawStr.indexOf(query) !== -1) {
            matches.push("[СОСТАВ] " + emp.name + " // " + emp.rank + " (" + emp.role + ") - " + emp.status);
          }
        });

        if (matches.length > 0) {
          matches.forEach(function (m) {
            printLine("  • " + m);
          });
          printLine("[SYS] Найдено совпадений: " + matches.length);
        } else {
          printLine("[SYS] ERROR: По запросу \"" + query + "\" данных не обнаружено.", "is-err");
        }
        return;
      }

      if (sub === "STAFF") {
        var nick = (arg1 || "").toLowerCase();
        if (!nick) {
          printLine("[SYS] ERROR: Укажите никнейм сотрудника.", "is-err");
          printLine("[TIP] Пример: D STAFF EGORIK0130", "is-tip");
          return;
        }

        var person = employeeDb[nick];
        if (person) {
          printLine("=== [ЛИЧНОЕ ДЕЛО СОТРУДНИКА // РЕЕСТР COMPLEX] ===");
          printLine("  ПОЗЫВНОЙ / НИК  : " + person.name);
          printLine("  ЗВАНИЕ / РОЛЬ   : " + person.rank + " [" + person.role + "]");
          printLine("  НАИГРАНО ЧАСОВ  : " + person.hours);
          printLine("  СДАНО ПО / СО   : " + person.po + " ПО / " + person.so + " СО");
          printLine("  ИКОКУ / КЕНСЭКИ : " + person.ikoku + " ИК. / " + person.kenseki + " КЕН.");
          printLine("  СТАТУС ДОПУСКА  : " + person.status);
          printLine("==================================================");
        } else {
          printLine("[SYS] Позывной '" + nick + "' отсутствует в локальном кэше.", "is-err");
          printLine("Данные обновляются из таблицы: <span class='dnp-term-link' onclick='window.open(\"" + sheetsUrl + "\",\"_blank\")'>ОТКРЫТЬ GOOGLE ТАБЛИЦУ ↗</span>");
        }
        return;
      }

      if (sub === "TABLE") {
        printLine("[SYS] Запрос доступа к ведомости личного состава...");
        window.open(sheetsUrl, "_blank");
        printLine("[SYS] Таблица открыта в новом окне браузера.");
        return;
      }

      if (sub === "BRUD") {
        printLine("[SYS] Запрос прямого доступа к регламенту БРУД...");
        window.open(brudUrl, "_blank");
        printLine("[SYS] Документ БРУД открыт в новом окне браузера.");
        return;
      }

      if (sub === "OPEN") {
        var targetNode = (arg1 || "").toLowerCase();
        var mapping = {
          "1": "ustav-01", "устав 1": "ustav-01", "основа": "ustav-01",
          "2": "ustav-02", "устав 2": "ustav-02", "правила": "ustav-02",
          "3": "ustav-03", "устав 3": "ustav-03", "повышения": "ustav-03",
          "4": "ustav-04", "устав 4": "ustav-04", "норма": "ustav-04",
          "5": "ustav-05", "устав 5": "ustav-05", "задания": "ustav-05",
          "6": "ustav-06", "устав 6": "ustav-06", "проверки": "ustav-06",
          "7": "ustav-07", "устав 7": "ustav-07", "активности": "ustav-07",
          "8": "ustav-08", "устав 8": "ustav-08", "прочее": "ustav-08",
          "9": "ustav-09", "устав 9": "ustav-09", "конец": "ustav-09",
          "корни": "roots", "roots": "roots", "бруд": "brud", "таблица": "table"
        };

        if (mapping[targetNode]) {
          var dest = mapping[targetNode];
          if (dest === "brud") {
            window.open(brudUrl, "_blank");
            printLine("[SYS] Переход к ресурсу БРУД...");
          } else if (dest === "table") {
            window.open(sheetsUrl, "_blank");
            printLine("[SYS] Переход к ведомости Google Таблиц...");
          } else {
            printLine("[SYS] Переключение интерфейса на модуль: " + dest.toUpperCase());
            openScreen(dest);
          }
        } else {
          printLine("[SYS] ERROR: Узел '" + targetNode + "' не опознан.", "is-err");
          printLine("[TIP] Используйте: D OPEN 1 .. 9, D OPEN КОРНИ, D OPEN ТАБЛИЦА", "is-tip");
        }
        return;
      }

      printLine("[SYS] Unknown command: D " + sub, "is-err");
      printLine("[TIP] Введите \"D HELP\" для справки.", "is-tip");
      return;
    }

    // 2. Секретный префикс J
    if (first === "J") {
      var secSub = (parts[1] || "").toUpperCase();

      if (!secSub || secSub === "HELP") {
        printLine("[SYS] ACCESS GRANTED: BLACK-OPS PROTOCOL INITIALIZED", "is-sec");
        printLine("  J ARCHIVE                   - Протокол инцидента 19██.04.12", "is-sec");
        printLine("  J ROOTS                     - Аварийный переход в поврежденный сектор", "is-sec");
        printLine("  J SECTOR                    - Диагностика целостности ядра 0x88F0A2", "is-sec");
        printLine("  J OVERRIDE                  - Сброс прав доступа комплекса", "is-sec");
        return;
      }

      if (secSub === "ROOTS") {
        printLine("[SYS] ПЕРЕНАПРАВЛЕНИЕ В АРХИВНЫЙ УЗЕЛ...", "is-sec");
        openScreen("roots");
        return;
      }

      if (secSub === "ARCHIVE") {
        printLine("[SYS] РАСШИФРОВКА ОСТАТОЧНЫХ ЛОГОВ...", "is-sec");
        printLine("ERR_HEX: 44 45 49 4E 4F 50 49 44 41 45 _ NULL_PTR");
        printLine("MEM_DUMP: 0x002B19F -- CORRUPTED BY SECTOR ANOMALY");
        printLine("ВНИМАНИЕ: Заражение информационного ядра ███████ подтверждено.");
        return;
      }

      if (secSub === "SECTOR") {
        printLine("[SYS] ДИАГНОСТИКА СЕКТОРА 02:", "is-sec");
        printLine("  ЦЕЛОСТНОСТЬ ХЭША: ПРОВАЛЕНО (FAIL: 0x88F0A2)");
        printLine("  СТАТУС ИЗОЛЯЦИИ : АКТИВЕН // УРОВЕНЬ ЗАЩИТЫ 4");
        return;
      }

      if (secSub === "OVERRIDE") {
        printLine("[SYS] ВЫПОЛНЕНИЕ АВАРИЙНОГО ПЕРЕОПРЕДЕЛЕНИЯ ПРАВ...", "is-sec");
        printLine("[SYS] WARNING: Несанкционированный доступ зафиксирован в журнале аналитиков.", "is-err");
        return;
      }

      printLine("[SYS] Security Command J " + secSub + " rejected.", "is-err");
      return;
    }

    // 3. Стандартные команды без префикса
    if (first === "HELP") {
      executeCommand("D HELP");
      return;
    }

    if (first === "CLS" || first === "CLEAR") {
      termOutput.innerHTML = "";
      return;
    }

    if (first === "ECHO") {
      var echoMsg = cmd.substring(4).trim();
      printLine(echoMsg);
      return;
    }

    if (first === "DIR") {
      executeCommand("D DIR " + (parts.slice(1).join(" ")));
      return;
    }

    if (first === "FIND") {
      executeCommand("D FIND " + (parts.slice(1).join(" ")));
      return;
    }

    if (first === "STATUS") {
      printLine("[SYS] TERMINAL STATUS: ONLINE // SYS.V-4");
      printLine("  LOCAL NET: STABLE | SYNC: 97% | CORE TEMP: 36C");
      return;
    }

    if (first === "TIME") {
      printLine("[SYS] ТЕКУЩЕЕ СИСТЕМНОЕ ВРЕМЯ: " + new Date().toLocaleTimeString() + " // " + new Date().toLocaleDateString());
      return;
    }

    // Неизвестная команда
    printLine("[SYS] Unknown command: " + cmd, "is-err");
    printLine("[TIP] Попробуйте написать \"D HELP\"", "is-tip");
  }

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