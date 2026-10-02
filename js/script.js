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
  var brudUrl = "https://docs.google.com/document/d/1E0ettcqE--eQjUvUlX4ZIv9UmGBjjXD7QLfmqlYDgAE/edit?usp=sharing";
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
      "РАЗДЕЛ 5: Задания (Архив задач для проверки РП-уровня)",
      "РАЗДЕЛ 6: Проверки и Лекции (Экзамены C/B/A, лекции ПО/СО/МП)",
      "РАЗДЕЛ 7: Активности (Шкала прогрессии, сброс очков по понедельникам)",
      "РАЗДЕЛ 8: Прочее (Проведение мероприятий: 5 и 7 звания)",
      "РАЗДЕЛ 9: Конец (Заключение, первоиздатель Wewewewestrelok)"
    ],
    "бруд": [
      "БРУД // Ссылка: " + brudUrl,
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

  var virtualFiles = {
    "ustav.txt": "DEINOPIDAE INDUSTRIES // СВОД УСТАВА\nЦель предприятия: разработка, снабжение, техподдержка департамента S.E.\nСоблюдение правил КВР, игровых регламентов и субординации обязательно.",
    "rules.txt": "ПРАВИЛА И САНКЦИИ:\n1. Устный выговор (фиксация мелких нарушений)\n2. Икоку (2 устных = 1 икоку)\n3. Кенсэки (2 икоку = 1 кенсэки). 3 кенсэки = увольнение.",
    "quota.txt": "ЕЖЕНЕДЕЛЬНАЯ НОРМА:\nКадет: 4 МП (4ч / 5 оборуд)\nC Rank: 3 МП (3ч / 4 оборуд)\nB Rank: 2 МП (3ч / 3 оборуд)\nA Rank: 2 МП (2ч / 2 оборуд)",
    "brud.txt": "БРУД: " + brudUrl,
    "secret.log": "19██.04.12: Аварийная изоляция нижнего инженерного крыла.\nПроизошло несанкционированное повреждение инфо-ядра. Уровень доступа: 4."
  };

  var envVars = {
    "OS": "Deinopidae Embedded Terminal [Version 4.10.88]",
    "SECTOR": "ARACHNA // DEINOPIDAE NODE",
    "TERMINAL_ID": "SE-DNP-CLI-02",
    "STATUS": "SYNC_ACTIVE",
    "USER": "OPERATOR"
  };

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
    var termInput = document.getElementById("term-input");

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
    var termInput = document.getElementById("term-input");

    if (termTopTitle) termTopTitle.textContent = "WELCOME TO DEINOPIDAE INDUSTRIES";
    if (termProgressLine) termProgressLine.textContent = '▶ LOAD COMPLETE, TYPE "D HELP" FOR SEE HELP';

    if (termAscii) {
      termAscii.textContent = asciiLogo;
      termAscii.style.display = "block";
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

  function setColor(arg) {
    var termWindow = document.getElementById("term-window");
    if (!termWindow) return;
    var code = (arg || "").toUpperCase().trim();
    var colorMap = {
      "WHITE": "#d4d9de", "DEFAULT": "#d4d9de", "RESET": "#d4d9de", "0F": "#d4d9de",
      "GREEN": "#4af626", "0A": "#4af626",
      "CYAN": "#00f0ff", "0B": "#00f0ff",
      "RED": "#ff5252", "0C": "#ff5252",
      "YELLOW": "#ffd700", "AMBER": "#ffb300", "0E": "#ffb300",
      "GRAY": "#8e999f", "07": "#8e999f"
    };

    if (colorMap[code]) {
      termWindow.style.setProperty("--term-color", colorMap[code]);
      printLine("[SYS] Цвет терминала изменен: " + code);
    } else {
      printLine("[SYS] Доступные цвета: WHITE, GREEN, AMBER, CYAN, RED, GRAY, DEFAULT (или 0A, 0B, 0C, 0F)");
    }
  }

  function executeCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) return;

    cmdHistory.push(cmd);
    cmdHistoryIndex = cmdHistory.length;

    printLine("█ " + cmd);

    var parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    var first = (parts[0] || "").toUpperCase();

    if (first === "D") {
      var sub = (parts[1] || "").toUpperCase();
      var arg1 = (parts[2] || "").replace(/^"|"$/g, "");
      var arg2 = (parts[3] || "").replace(/^"|"$/g, "");

      if (!sub || sub === "HELP") {
        printLine("=== [DEINOPIDAE OS // КОМАНДЫ БАЗЫ ДАННЫХ] ===");
        printLine("  D HELP                      - Вызов списка команд");
        printLine("  D DIR [директория]          - Просмотр содержимого директорий");
        printLine("  D FIND \"слово\" [директория]  - Поиск данных по реестру и уставу");
        printLine("  D STAFF <никнейм>           - Личное дело и досье сотрудника");
        printLine("  D OPEN <раздел / ссылка>    - Быстрый переход по узлам системы");
        printLine("  D TABLE                     - Прямой доступ к таблице состава");
        printLine("  D BRUD                      - Доступ к главному регламенту БРУД");
        printLine("=== [СЛУЖЕБНЫЕ УТИЛИТЫ CMD] ===");
        printLine("  TREE                        - Древовидная структура разделов комплекса");
        printLine("  TYPE <файл>                 - Просмотр файлов (ustav.txt, rules.txt...)");
        printLine("  COLOR <цвет>                - Изменение цвета (WHITE, GREEN, AMBER, CYAN, RED)");
        printLine("  HOSTNAME / WHOAMI           - Идентификатор узла и оператора");
        printLine("  SYSTEMINFO                  - Спецификации терминала");
        printLine("  SET                         - Переменные окружения");
        printLine("  DATE / TIME                 - Время комплекса");
        printLine("  ECHO <текст>                - Вывод текста");
        printLine("  CLS                         - Очистить терминал");
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
          printLine("  • АКТИВНОСТИ   - Баллы и прогрессия уровней");
          printLine("  • ДОКУМЕНТЫ    - Внеурочки, соглашение, справочники");
          printLine("[TIP] Используйте: D DIR <название>");
          return;
        }

        if (directories[dirTarget]) {
          printLine("[SYS] СОДЕРЖИМОЕ ДИРЕКТОРИИ [" + dirTarget.toUpperCase() + "]:");
          directories[dirTarget].forEach(function (row) {
            printLine("  > " + row);
          });
        } else {
          printLine("[SYS] ERROR: Директория '" + dirTarget + "' не найдена.");
          printLine("[TIP] Введите D DIR для списка всех доступных каталогов.");
        }
        return;
      }

      if (sub === "FIND") {
        var query = (arg1 || "").toLowerCase();
        var scope = (arg2 || "").toLowerCase();

        if (!query) {
          printLine("[SYS] ERROR: Не указана фраза для поиска.");
          printLine("[TIP] Синтаксис: D FIND \"фраза\" или D FIND \"фраза\" \"директория\"");
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
          printLine("[SYS] Найдено записей: " + matches.length);
        } else {
          printLine("[SYS] ERROR: По запросу \"" + query + "\" совпадений нет.");
        }
        return;
      }

      if (sub === "STAFF") {
        var nick = (arg1 || "").toLowerCase();
        if (!nick) {
          printLine("[SYS] ERROR: Укажите никнейм сотрудника.");
          printLine("[TIP] Пример: D STAFF EGORIK0130");
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
          printLine("[SYS] Позывной '" + nick + "' отсутствует в локальном кэше.");
          printLine("Данные обновляются из таблицы: <span class='dnp-term-link' onclick='window.open(\"" + sheetsUrl + "\",\"_blank\")'>ОТКРЫТЬ GOOGLE ТАБЛИЦУ ↗</span>");
        }
        return;
      }

      if (sub === "TABLE") {
        printLine("[SYS] Запрос ведомости личного состава...");
        window.open(sheetsUrl, "_blank");
        printLine("[SYS] Таблица открыта в отдельном окне браузера.");
        return;
      }

      if (sub === "BRUD") {
        printLine("[SYS] Запрос главного регламента БРУД...");
        window.open(brudUrl, "_blank");
        printLine("[SYS] Документ БРУД открыт в отдельном окне браузера.");
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
          printLine("[SYS] ERROR: Узел '" + targetNode + "' не опознан.");
          printLine("[TIP] Используйте: D OPEN 1 .. 9, D OPEN КОРНИ, D OPEN ТАБЛИЦА");
        }
        return;
      }

      printLine("[SYS] Unknown command: D " + sub);
      printLine("[TIP] Введите \"D HELP\" для справки.");
      return;
    }

    if (first === "J") {
      var secSub = (parts[1] || "").toUpperCase();

      if (!secSub || secSub === "HELP") {
        printLine("[SYS] PROTOCOL J INITIALIZED:");
        printLine("  J ARCHIVE                   - Протокол инцидента 19██.04.12");
        printLine("  J ROOTS                     - Переход в поврежденный сектор");
        printLine("  J SECTOR                    - Диагностика целостности ядра 0x88F0A2");
        printLine("  J OVERRIDE                  - Сброс прав доступа комплекса");
        return;
      }

      if (secSub === "ROOTS") {
        printLine("[SYS] ПЕРЕНАПРАВЛЕНИЕ В АРХИВНЫЙ УЗЕЛ...");
        openScreen("roots");
        return;
      }

      if (secSub === "ARCHIVE") {
        printLine("[SYS] РАСШИФРОВКА ОСТАТОЧНЫХ ЛОГОВ:");
        printLine("ERR_HEX: 44 45 49 4E 4F 50 49 44 41 45 _ NULL_PTR");
        printLine("MEM_DUMP: 0x002B19F -- CORRUPTED BY SECTOR ANOMALY");
        printLine("ВНИМАНИЕ: Заражение информационного ядра ███████ подтверждено.");
        return;
      }

      if (secSub === "SECTOR") {
        printLine("[SYS] ДИАГНОСТИКА СЕКТОРА 02:");
        printLine("  ЦЕЛОСТНОСТЬ ХЭША: FAIL (0x88F0A2)");
        printLine("  СТАТУС ИЗОЛЯЦИИ : АКТИВЕН // УРОВЕНЬ ЗАЩИТЫ 4");
        return;
      }

      if (secSub === "OVERRIDE") {
        printLine("[SYS] ВЫПОЛНЕНИЕ АВАРИЙНОГО ПЕРЕОПРЕДЕЛЕНИЯ ПРАВ...");
        printLine("[SYS] WARNING: Зафиксирован несанкционированный доступ.");
        return;
      }

      printLine("[SYS] Security Command J " + secSub + " rejected.");
      return;
    }

    if (first === "HELP") {
      executeCommand("D HELP");
      return;
    }

    if (first === "COLOR") {
      setColor(parts[1]);
      return;
    }

    if (first === "TREE") {
      printLine("DEINOPIDAE:\\");
      printLine("├── 01_USTAV");
      printLine("│   ├── 01_osnova.dat");
      printLine("│   ├── 02_rules.dat");
      printLine("│   ├── 03_promotions.dat");
      printLine("│   ├── 04_quota.dat");
      printLine("│   ├── 05_tasks.dat");
      printLine("│   ├── 06_exams_lectures.dat");
      printLine("│   ├── 07_activities.dat");
      printLine("│   ├── 08_misc.dat");
      printLine("│   └── 09_final.dat");
      printLine("├── 02_DATABASE");
      printLine("│   ├── staff_registry.db");
      printLine("│   └── external_links.cfg");
      printLine("├── 03_ROOTS [DAMAGED]");
      printLine("│   └── sector_02.corrupt");
      printLine("└── 04_RECRUITMENT [LOCKED]");
      return;
    }

    if (first === "TYPE") {
      var fileName = (parts[1] || "").toLowerCase();
      if (!fileName) {
        printLine("[SYS] Синтаксис: TYPE <имя_файла>");
        printLine("[SYS] Доступные файлы: ustav.txt, rules.txt, quota.txt, brud.txt, secret.log");
        return;
      }
      if (virtualFiles[fileName]) {
        printLine(virtualFiles[fileName]);
      } else {
        printLine("[SYS] Файл не найден: " + fileName);
      }
      return;
    }

    if (first === "HOSTNAME") {
      printLine("SE-DNP-NODE04-COMPLEX");
      return;
    }

    if (first === "WHOAMI") {
      printLine("deinopidae\\guest_operator");
      return;
    }

    if (first === "SYSTEMINFO") {
      printLine("Название ОС:                 DEINOPIDAE EMBEDDED OS");
      printLine("Версия ОС:                   4.10.88 Build 2026");
      printLine("Производитель системы:       Arachna S.E. Department");
      printLine("Тип системы:                 x64-based PDA Terminal");
      printLine("Сетевой адаптер:             Local Link: Stable (Sync: 97%)");
      printLine("Температура ядра:            36°C");
      return;
    }

    if (first === "SET") {
      Object.keys(envVars).forEach(function (k) {
        printLine(k + "=" + envVars[k]);
      });
      return;
    }

    if (first === "TITLE") {
      var newTitle = cmd.substring(5).trim();
      var topTitle = document.getElementById("term-top-title");
      if (newTitle && topTitle) {
        topTitle.textContent = newTitle;
        printLine("[SYS] Заголовок окна обновлен.");
      } else {
        printLine("[SYS] Укажите заголовок: TITLE <текст>");
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

    if (first === "CLS" || first === "CLEAR") {
      var termOutput = document.getElementById("term-output");
      if (termOutput) termOutput.innerHTML = "";
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

    printLine("[SYS] Unknown command: " + cmd);
    printLine("[TIP] Попробуйте написать \"D HELP\"");
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