(function () {
  var API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? ""
    : "https://deinopidae-api.onrender.com";

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

  window.openScreen = function(name) {
    if (isTransitioning) return;

    var targetPanel = root.querySelector('[data-screen-panel="' + name + '"]');
    if (!targetPanel) return;

    var isExternal = ["forms-gui", "tickets", "notifications", "admin-panel"].indexOf(name) !== -1;
    var ustavNav = document.getElementById("dnp-nav-ustav");
    var ustavStatus = document.getElementById("dnp-ustav-status");

    if (isExternal && ustavNav) {
      ustavNav.removeAttribute("open");
      if (ustavStatus) ustavStatus.textContent = "CLOSED";
      buttons.forEach(function(b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
    }

    if (layout) {
      if (name === "database") {
        layout.classList.add("is-terminal-mode");
      } else {
        layout.classList.remove("is-terminal-mode");
      }
    }

    var currentPanel = root.querySelector(".dnp-screen.is-visible");

    function applyScreenSwitch() {
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
      } else if (name === "tickets") {
        loadMyTickets();
      } else if (name === "notifications") {
        loadNotifications();
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
          applyScreenSwitch();
          if (curHead) curHead.classList.remove("head-slide-out");

          var newHead = targetPanel.querySelector(".dnp-screen-head");
          if (newHead) {
            newHead.classList.remove("head-slide-in");
            void newHead.offsetWidth;
            newHead.classList.add("head-slide-in");
          }
        } finally {
          isTransitioning = false;
        }
      }, 200);
    } else {
      applyScreenSwitch();
    }
  };

  root.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-screen]");
    if (trigger && !trigger.disabled) {
      var screenName = trigger.getAttribute("data-screen");
      openScreen(screenName);
    }
  });

  var ustavNav = document.getElementById("dnp-nav-ustav");
  if (ustavNav) {
    ustavNav.addEventListener("toggle", function() {
      var ustavStatus = document.getElementById("dnp-ustav-status");
      if (ustavStatus) {
        ustavStatus.textContent = ustavNav.open ? "OPEN" : "CLOSED";
      }
    });
  }

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
    "SYSTEM_NODE": "DEINOPIDAE S.E. - CORE",
    "TERMINAL_STATUS": "ACTIVE"
  };

  function getCurrentUser() {
    var user = localStorage.getItem("dnp_active_user");
    if (user) {
      try {
        var parsed = JSON.parse(user);
        if (parsed && (parsed.displayName || parsed.username)) {
          return (parsed.displayName || parsed.username).toUpperCase();
        }
      } catch (e) {}
    }
    return "USER";
  }

  function getPromptStr() {
    return 'D:\\"' + getCurrentUser() + '">';
  }

  window.renderAuthHeader = function() {
    var slot = document.getElementById("dnp-auth-header-slot");
    if (!slot) return;

    var rawUser = localStorage.getItem("dnp_active_user");
    if (rawUser) {
      try {
        var u = JSON.parse(rawUser);
        slot.innerHTML = [
          '<div class="dnp-user-pill" id="dnp-user-pill">',
          '  <div class="dnp-user-avatar">' + (u.username ? u.username[0].toUpperCase() : 'U') + '</div>',
          '  <span class="dnp-user-name">' + (u.displayName || u.username || 'OPERATOR') + '</span>',
          '</div>',
          '<div class="dnp-user-dropdown" id="dnp-user-dropdown" style="display: none;">',
          '  <div class="dnp-dropdown-item" id="dnp-menu-tickets">Обращения</div>',
          '  <div class="dnp-dropdown-item" id="dnp-menu-notifs">Уведомления</div>',
          '  <div class="dnp-dropdown-item is-logout" id="dnp-menu-logout">Выйти из аккаунта</div>',
          '</div>'
        ].join('');

        var pill = document.getElementById("dnp-user-pill");
        var dd = document.getElementById("dnp-user-dropdown");
        pill.addEventListener("click", function(e) {
          e.stopPropagation();
          dd.style.display = dd.style.display === "none" ? "flex" : "none";
        });

        document.addEventListener("click", function() {
          if (dd) dd.style.display = "none";
        });

        document.getElementById("dnp-menu-tickets").addEventListener("click", function() {
          openScreen("tickets");
        });
        document.getElementById("dnp-menu-notifs").addEventListener("click", function() {
          openScreen("notifications");
        });
        document.getElementById("dnp-menu-logout").addEventListener("click", function() {
          localStorage.removeItem("dnp_active_user");
          localStorage.removeItem("dnp_auth_token");
          location.reload();
        });
        return;
      } catch (e) {}
    }
   checkOfficerStatus();
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
    termTimer = setTimeout(runBootStep, 150);
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

  function executeFind(queryRaw) {
    var q = queryRaw.trim().toLowerCase();
    if (!q) {
      printLine('Синтаксис: FIND "фраза" или FIND <слово>');
      return;
    }

    var terms = q.split(/\s+/).filter(Boolean);
    var matches = [];

    var screens = document.querySelectorAll("[data-screen-panel]");
    screens.forEach(function (panel) {
      var panelId = panel.getAttribute("data-screen-panel");
      if (panelId === "database" || panelId === "forms-gui" || panelId === "tickets" || panelId === "notifications") return;

      var head = panel.querySelector(".dnp-screen-head h1");
      var headText = head ? head.textContent.trim() : panelId;

      var modules = panel.querySelectorAll(".dnp-module, .dnp-rank-block");
      if (modules.length > 0) {
        modules.forEach(function (m) {
          var text = m.innerText || m.textContent;
          var lower = text.toLowerCase();
          var matched = terms.every(function (t) { return lower.indexOf(t) !== -1; });

          if (matched) {
            var snippet = text.replace(/\s+/g, " ").trim();
            if (snippet.length > 120) snippet = snippet.substring(0, 120) + "...";
            matches.push({
              source: "УСТАВ",
              title: headText,
              snippet: snippet,
              panelId: panelId
            });
          }
        });
      } else {
        var allText = panel.innerText || panel.textContent;
        var lower = allText.toLowerCase();
        if (terms.every(function (t) { return lower.indexOf(t) !== -1; })) {
          matches.push({
            source: "УСТАВ",
            title: headText,
            snippet: allText.replace(/\s+/g, " ").trim().substring(0, 110) + "...",
            panelId: panelId
          });
        }
      }
    });

    var db = window.employeeDb || {};
    Object.keys(db).forEach(function (k) {
      var emp = db[k];
      var rawStr = (emp.name + " " + emp.rank + " " + (emp.title || "") + " " + (emp.penalties || "")).toLowerCase();
      var matched = terms.every(function (t) { return rawStr.indexOf(t) !== -1; });
      if (matched) {
        matches.push({
          source: "СОСТАВ",
          title: emp.name + " // " + emp.title + " [" + emp.rank + "]",
          snippet: "Норма: " + emp.quota_status + " | Часы: " + emp.hours + " | Активность: " + emp.activity + " PTS",
          nick: emp.name
        });
      }
    });

    if (matches.length > 0) {
      printLine("=== [НАЙДЕНО СОВПАДЕНИЙ: " + matches.length + '] ===');
      matches.slice(0, 10).forEach(function (m) {
        if (m.source === "УСТАВ") {
          printLine('  • <span style="color:#00f0ff;">[' + m.source + ']</span> <b>' + m.title + '</b>: <span style="color:#8ba0ad;">' + m.snippet + '</span>');
        } else {
          printLine('  • <span style="color:#4af626;">[' + m.source + ']</span> <b>' + m.title + '</b> — <span style="color:#8ba0ad;">' + m.snippet + '</span>');
        }
      });
      if (matches.length > 10) {
        printLine('  ...и ещё ' + (matches.length - 10) + ' совпадений. Уточните запрос.');
      }
    } else {
      printLine('По запросу "' + q + '" данных не обнаружено.');
    }
  }

  async function submitFormConsole(typeNum, desc, links) {
    var typeMap = {
      "1": "Внеурочка",
      "2": "Изменение устава",
      "3": "Обращение к руководству"
    };

    var type = typeMap[typeNum.toLowerCase()] || typeNum;
    var token = localStorage.getItem("dnp_auth_token");
    var userRaw = localStorage.getItem("dnp_active_user");

    if (!token || !userRaw) {
      printLine('<span style="color:#ff5252;">[ОТКАЗ] Для отправки формы необходимо войти в Личный кабинет.</span>');
      return;
    }

    if (!desc) {
      printLine('<span style="color:#ff5252;">[ОШИБКА] Текст описания не может быть пустым.</span>');
      return;
    }

    printLine('[SYS] Передача рапорта в базу данных комплекса...');

    try {
      var res = await fetch(API_BASE + "/api/forms/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          type: type,
          description: desc,
          links: links || "Отсутствуют"
        })
      });

      var data = await res.json();
      if (res.ok && data.success) {
        printLine('<span style="color:#4af626;">[УСПЕХ] Обращение #' + data.reportId + ' зарегистрировано!</span>');
      } else {
        printLine('<span style="color:#ff5252;">[ОТКАЗ] ' + (data.error || "Ошибка сохранения") + '</span>');
      }
    } catch (e) {
      printLine('<span style="color:#ff5252;">[СБОЙ СЕТИ] Не удалось связаться с сервером.</span>');
    }
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

    if (first === "D" && parts.length > 1) {
      parts.shift();
      first = (parts[0] || "").toUpperCase();
    }

    if (first === "FORMS") {
      var isGui = parts.some(function(p) { return p.toLowerCase() === "-gui"; });
      if (isGui) {
        openScreen("forms-gui");
        printLine('[SYS] Переход в форму подачи обращений.');
        return;
      }

      if (parts.length >= 3) {
        var catNum = parts[1].replace(/^"|"$/g, "");
        var desc = parts[2].replace(/^"|"$/g, "");
        var links = (parts[3] || "").replace(/^"|"$/g, "");
        submitFormConsole(catNum, desc, links);
        return;
      }

      printLine("=== [СИСТЕМА ПОДАЧИ ОТЧЁТОВ И ФОРМ] ===");
      printLine("Категории обращений:");
      printLine("  [1] Внеурочка (Починка / Создание оборудования)");
      printLine("  [2] Изменение устава (Предложение поправки)");
      printLine("  [3] Обращение к руководству (Запрос / Жалоба / Вопрос)");
      printLine("");
      printLine('Отправка через консоль: FORMS <1-3> "<текст>" "<ссылка>"');
      printLine('Графический интерфейс: FORMS -gui');
      return;
    }

    if (first === "STAFF") {
      var nick = (parts[1] || "").replace(/^"|"$/g, "").toLowerCase();

      if (!nick) {
        printLine("Синтаксис: STAFF <никнейм>");
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
        if (p.lectures) printLine("  ЛЕКЦИИ            : ПО: " + p.lectures.po + " | СО: " + p.lectures.so + " | МП: " + p.lectures.mp);
        if (p.exams) printLine("  ПРОВЕРКИ          : C: " + p.exams.c + " | B: " + p.exams.b + " | A: " + p.exams.a);
        printLine("  НАКАЗАНИЯ         : " + p.penalties);
        printLine("  АКТИВ / КОЙНЫ     : Хихикойны: " + p.coins + " | Очки активности: " + p.activity);
        printLine("======================================================");
      } else {
        printLine("Позывной '" + nick + "' не найден в локальном реестре.");
        printLine("Ведомость: <span class='dnp-term-link' onclick='window.open(\"" + sheetsUrl + "\",\"_blank\")'>ОТКРЫТЬ ТАБЛИЦУ DEINOPIDAE ↗</span>");
      }
      return;
    }

    if (first === "FIND") {
      var query = parts.slice(1).join(" ").replace(/^"|"$/g, "");
      executeFind(query);
      return;
    }

    if (first === "GOTO") {
      var target = (parts[1] || "").toLowerCase();
      var secMap = {
        "1": "ustav-01", "2": "ustav-02", "3": "ustav-03", "4": "ustav-04",
        "5": "ustav-05", "6": "ustav-06", "7": "ustav-07", "8": "ustav-08", "9": "ustav-09",
        "roots": "roots", "корни": "roots"
      };
      var targetId = secMap[target] || target;
      if (targetId) {
        openScreen(targetId);
        printLine('[SYS] Переход в раздел: ' + targetId);
      } else {
        printLine('Использование: GOTO <номер раздела 1-9>');
      }
      return;
    }

    if (first === "HELP") {
      printLine("HELP                  - Вызов списка доступных команд");
      printLine("FIND <фраза>          - Глобальный поиск по уставу и сотрудникам");
      printLine("STAFF <ник>           - Личное дело сотрудника");
      printLine('FORMS <1-3> "..." ".." - Отправка рапорта из консоли');
      printLine("FORMS -gui            - Графический интерфейс подачи форм");
      printLine("GOTO <1-9>            - Быстрый переход в раздел устава");
      printLine("CLS / CLEAR           - Очистить экран консоли");
      return;
    }

    if (first === "CLS" || first === "CLEAR") {
      var termOutput = document.getElementById("term-output");
      if (termOutput) termOutput.innerHTML = "";
      return;
    }

    if (first === "WHOAMI") {
      printLine('D:\\"' + getCurrentUser() + '"');
      return;
    }

    printLine('Команда "' + cmd + '" не распознана. Введите "HELP" для списка команд.');
  }

  var termInput = document.getElementById("term-input");
  var termTyped = document.getElementById("term-typed");

  if (termInput) {
    termInput.addEventListener("input", function() {
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

  var formCategory = document.getElementById("gui-form-category");
  var targetBox = document.getElementById("gui-form-target-box");
  var rulesBox = document.getElementById("gui-form-rules-box");

  if (formCategory) {
    formCategory.addEventListener("change", function() {
      var val = formCategory.value;
      if (targetBox) targetBox.style.display = val === "Обращение к руководству" ? "block" : "none";
      if (rulesBox) rulesBox.style.display = val === "Изменение устава" ? "block" : "none";
    });
  }

  window.submitFormFromGui = async function() {
    var token = localStorage.getItem("dnp_auth_token");
    var statusMsg = document.getElementById("gui-form-status-msg");
    var warning = document.getElementById("forms-auth-warning");

    if (!token) {
      if (warning) warning.style.display = "block";
      statusMsg.style.color = "var(--danger)";
      statusMsg.textContent = "[ОТКАЗ] Необходима авторизация в Личном кабинете.";
      return;
    }

    var category = document.getElementById("gui-form-category").value;
    var desc = document.getElementById("gui-form-desc").value.trim();
    var links = document.getElementById("gui-form-links").value.trim();
    var targetUser = document.getElementById("gui-form-target") ? document.getElementById("gui-form-target").value.trim() : "";
    var rulesPoints = document.getElementById("gui-form-rules") ? document.getElementById("gui-form-rules").value.trim() : "";

    if (!desc) {
      statusMsg.style.color = "var(--danger)";
      statusMsg.textContent = "[ОШИБКА] Заполните описание обращения.";
      return;
    }

    statusMsg.style.color = "var(--line)";
    statusMsg.textContent = "[SYS] Передача рапорта в базу...";

    try {
      var res = await fetch(API_BASE + "/api/forms/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          type: category,
          description: desc,
          links: links || "Отсутствуют",
          targetUser: targetUser,
          rulesPoints: rulesPoints
        })
      });

      var data = await res.json();
      if (res.ok && data.success) {
        statusMsg.style.color = "var(--ok)";
        statusMsg.textContent = "[УСПЕХ] Обращение #" + data.reportId + " зарегистрировано!";
        document.getElementById("gui-form-desc").value = "";
        document.getElementById("gui-form-links").value = "";
      } else {
        statusMsg.style.color = "var(--danger)";
        statusMsg.textContent = "[ОТКАЗ] " + (data.error || "Не удалось отправить");
      }
    } catch (e) {
      statusMsg.style.color = "var(--danger)";
      statusMsg.textContent = "[СБОЙ СЕТИ] Ошибка соединения с сервером.";
    }
  };

  var submitBtn = document.getElementById("gui-form-submit-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", window.submitFormFromGui);
  }

  window.loadMyTickets = async function() {
    var cont = document.getElementById("tickets-list-container");
    if (!cont) return;

    var token = localStorage.getItem("dnp_auth_token");
    if (!token) {
      cont.innerHTML = '<div style="color:var(--muted); font-size:12.5px;">Авторизуйтесь для просмотра ваших обращений.</div>';
      return;
    }

    cont.innerHTML = '<div style="color:var(--line); font-size:12.5px;">Загрузка реестра обращений...</div>';

    try {
      var res = await fetch(API_BASE + "/api/forms/my", {
        headers: { "Authorization": "Bearer " + token }
      });
      var list = await res.json();

      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:13px; padding:12px 0;">Обращений нету.</div>';
        return;
      }

      cont.innerHTML = list.map(function(t) {
        var stClass = "st-pending";
        if (t.status === "В РАБОТЕ") stClass = "st-work";
        if (t.status === "ОДОБРЕНО") stClass = "st-ok";
        if (t.status === "ОТКЛОНЕНО") stClass = "st-reject";

        var dateSubmit = t.submittedAt ? new Date(t.submittedAt).toLocaleDateString() + " " + new Date(t.submittedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "—";
        var dateUpdate = t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() + " " + new Date(t.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "—";

        return [
          '<div class="dnp-ticket-card" onclick="this.classList.toggle(\'is-open\')">',
          '  <div class="dnp-ticket-header">',
          '    <div>',
          '      <b>' + t.type + ' <span style="color:var(--muted); font-size:11px;">(#' + t.reportId + ')</span></b>',
          '    </div>',
          '    <span class="dnp-ticket-status ' + stClass + '">' + (t.status || "НА ПРОВЕРКЕ") + '</span>',
          '  </div>',
          '  <div class="dnp-ticket-history">',
          '    <div><span style="color:var(--line);">Дата подачи:</span> ' + dateSubmit + '</div>',
          '    <div><span style="color:var(--line);">Суть обращения:</span> ' + t.description + '</div>',
          t.links && t.links !== "Отсутствуют" ? '    <div><span style="color:var(--line);">Материалы:</span> <a href="' + t.links + '" target="_blank" style="color:#00f0ff; text-decoration:underline;">Открыть ссылку ↗</a></div>' : '',
          t.officer ? '    <div style="margin-top:6px; border-top:1px dashed var(--line-soft); padding-top:6px;"><span style="color:var(--line);">Офицер:</span> ' + t.officer + ' (' + dateUpdate + ')</div>' : '',
          t.officerComment ? '    <div><span style="color:var(--line);">Вердикт / Комментарий:</span> <b style="color:#fff;">' + t.officerComment + '</b></div>' : '',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:12.5px;">Сбой при загрузке обращений.</div>';
    }
  };

  window.loadNotifications = async function() {
    var cont = document.getElementById("notifications-list-container");
    var token = localStorage.getItem("dnp_auth_token");

    if (!token) {
      if (cont) cont.innerHTML = '<div style="color:var(--muted); font-size:12.5px;">Авторизуйтесь для доступа к уведомлениям.</div>';
      return;
    }

    try {
      var res = await fetch(API_BASE + "/api/notifications/my", {
        headers: { "Authorization": "Bearer " + token }
      });
      var list = await res.json();

      if (!cont) return;
      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:13px; padding:12px 0;">Уведомлений нету.</div>';
        return;
      }

      cont.innerHTML = list.map(function(n) {
        var unreadClass = n.isRead ? "" : "is-unread";
        var dateStr = new Date(n.createdAt).toLocaleDateString() + " " + new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return [
          '<div class="dnp-notif-card ' + unreadClass + '" onclick="markNotificationRead(\'' + n._id + '\')">',
          '  <div class="dnp-notif-head">',
          '    <b>' + n.title + '</b>',
          '    <span class="dnp-notif-time">' + dateStr + '</span>',
          '  </div>',
          '  <p>' + n.message + '</p>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      if (cont) cont.innerHTML = '<div style="color:var(--danger); font-size:12.5px;">Ошибка загрузки уведомлений.</div>';
    }
  };

  window.markNotificationRead = async function(id) {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;
    try {
      await fetch(API_BASE + "/api/notifications/read/" + id, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      loadNotifications();
    } catch (e) {}
  };

  window.markAllNotificationsRead = async function() {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;
    try {
      await fetch(API_BASE + "/api/notifications/read-all", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      loadNotifications();
    } catch (e) {}
  };

  async function checkOfficerStatus() {
    var token = localStorage.getItem("dnp_auth_token");
    var navBtn = document.getElementById("dnp-nav-admin");
    if (!token || !navBtn) return;
    try {
      var res = await fetch(API_BASE + "/api/admin/check", {
        headers: { "Authorization": "Bearer " + token }
      });
      var data = await res.json();
      if (data.isOfficer) {
        navBtn.style.display = "grid";
      } else {
        navBtn.style.display = "none";
      }
    } catch (e) {
      navBtn.style.display = "none";
    }
  }

  document.querySelectorAll(".dnp-admin-tab-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".dnp-admin-tab-btn").forEach(function(b) { b.classList.remove("is-active"); });
      document.querySelectorAll(".dnp-admin-panel-view").forEach(function(v) { v.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var tab = btn.getAttribute("data-admin-tab");
      var view = document.getElementById("adm-view-" + tab);
      if (view) view.classList.add("is-active");

      if (tab === "tickets") loadAdminTickets();
      if (tab === "ustav") loadAdminUstav();
      if (tab === "users") loadAdminUsers();
      if (tab === "officers") loadAdminOfficers();
    });
  });

  window.loadAdminTickets = async function() {
    var cont = document.getElementById("adm-tickets-list");
    var token = localStorage.getItem("dnp_auth_token");
    if (!cont || !token) return;
    cont.innerHTML = '<div style="color:var(--muted); font-size:11.5px;">Загрузка тикетов...</div>';
    try {
      var res = await fetch(API_BASE + "/api/admin/tickets", {
        headers: { "Authorization": "Bearer " + token }
      });
      var list = await res.json();
      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:11.5px;">Обращений нет.</div>';
        return;
      }
      cont.innerHTML = list.map(function(t) {
        return [
          '<div style="background:#020507; border:1px solid var(--line-soft); padding:10px; display:flex; flex-direction:column; gap:6px;">',
          '  <div style="display:flex; justify-content:space-between; align-items:center;">',
          '    <b>#' + t.reportId + ' // ' + t.type + ' (' + t.username + ' / ' + t.roblox + ')</b>',
          '    <span style="font-size:10px; padding:2px 6px; border:1px solid var(--line);">' + t.status + '</span>',
          '  </div>',
          '  <div style="font-size:12px; color:var(--text);">' + t.description + '</div>',
          t.links && t.links !== "Отсутствуют" ? '<div style="font-size:11px;"><a href="' + t.links + '" target="_blank" style="color:#00f0ff; text-decoration:underline;">Материалы ↗</a></div>' : '',
          '  <div style="display:flex; gap:6px; margin-top:4px; align-items:center;">',
          '    <input type="text" id="adm-comment-' + t.reportId + '" placeholder="Комментарий офицера" value="' + (t.officerComment || '') + '" style="flex:1; background:#04090d; border:1px solid var(--line-soft); color:#fff; padding:4px 8px; font-size:11px; font-family:monospace;">',
          '    <button type="button" class="dnp-action" style="margin:0; padding:4px 8px; font-size:10.5px; border-color:var(--ok); color:var(--ok);" onclick="respondAdminTicket(\'' + t.reportId + '\', \'ОДОБРЕНО\')">ОДОБРИТЬ</button>',
          '    <button type="button" class="dnp-action" style="margin:0; padding:4px 8px; font-size:10.5px; border-color:var(--danger); color:var(--danger);" onclick="respondAdminTicket(\'' + t.reportId + '\', \'ОТКЛОНЕНО\')">ОТКЛОНИТЬ</button>',
          '    <button type="button" class="dnp-action" style="margin:0; padding:4px 8px; font-size:10.5px;" onclick="deleteAdminTicket(\'' + t.reportId + '\')">УДАЛИТЬ</button>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:11.5px;">Ошибка загрузки тикетов.</div>';
    }
  };

  window.respondAdminTicket = async function(reportId, status) {
    var token = localStorage.getItem("dnp_auth_token");
    var commentInput = document.getElementById("adm-comment-" + reportId);
    var comment = commentInput ? commentInput.value.trim() : "";
    try {
      await fetch(API_BASE + "/api/admin/tickets/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ reportId: reportId, status: status, officerComment: comment })
      });
      loadAdminTickets();
    } catch (e) {}
  };

  window.deleteAdminTicket = async function(reportId) {
    if (!confirm("Удалить тикет " + reportId + "?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await fetch(API_BASE + "/api/admin/tickets/" + reportId, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      loadAdminTickets();
    } catch (e) {}
  };

  window.loadAdminUsers = async function() {
    var tbody = document.querySelector("#adm-users-table tbody");
    var token = localStorage.getItem("dnp_auth_token");
    if (!tbody || !token) return;
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);">Загрузка аккаунтов...</td></tr>';
    try {
      var res = await fetch(API_BASE + "/api/admin/users", {
        headers: { "Authorization": "Bearer " + token }
      });
      var users = await res.json();
      tbody.innerHTML = users.map(function(u) {
        return [
          '<tr>',
          '  <td><b>' + (u.displayName || u.username) + '</b></td>',
          '  <td>' + u.roblox + '</td>',
          '  <td>' + (u.activityStatus || 'В активе') + '</td>',
          '  <td>' + new Date(u.registeredAt).toLocaleDateString() + '</td>',
          '  <td><button type="button" class="dnp-action" style="margin:0; padding:2px 6px; font-size:10px; border-color:var(--danger); color:var(--danger);" onclick="deleteAdminUser(\'' + u._id + '\')">УДАЛИТЬ</button></td>',
          '</tr>'
        ].join('');
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--danger);">Ошибка загрузки пользователей.</td></tr>';
    }
  };

  window.deleteAdminUser = async function(id) {
    if (!confirm("Удалить аккаунт пользователя?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await fetch(API_BASE + "/api/admin/users/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      loadAdminUsers();
    } catch (e) {}
  };

  window.loadAdminOfficers = async function() {
    var cont = document.getElementById("adm-officers-list");
    var token = localStorage.getItem("dnp_auth_token");
    if (!cont || !token) return;
    try {
      var res = await fetch(API_BASE + "/api/admin/officers", {
        headers: { "Authorization": "Bearer " + token }
      });
      var list = await res.json();
      cont.innerHTML = list.map(function(o) {
        return [
          '<div style="background:#020507; border:1px solid var(--line-soft); padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">',
          '  <div><b style="color:#fff;">' + o.roblox + '</b><span style="font-size:10.5px; color:var(--muted); margin-left:8px;">(Добавил: ' + o.addedBy + ')</span></div>',
          '  <button type="button" class="dnp-action" style="margin:0; padding:2px 6px; font-size:10px; border-color:var(--danger); color:var(--danger);" onclick="removeAdminOfficer(\'' + o.roblox + '\')">СНЯТЬ</button>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {}
  };

  window.addAdminOfficer = async function() {
    var input = document.getElementById("adm-new-officer-roblox");
    var nick = input ? input.value.trim() : "";
    if (!nick) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await fetch(API_BASE + "/api/admin/officers/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ roblox: nick })
      });
      var data = await res.json();
      if (res.ok) {
        input.value = "";
        loadAdminOfficers();
      } else {
        alert(data.error || "Ошибка");
      }
    } catch (e) {}
  };

  window.removeAdminOfficer = async function(nick) {
    if (!confirm("Снять статус офицера с " + nick + "?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await fetch(API_BASE + "/api/admin/officers/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ roblox: nick })
      });
      loadAdminOfficers();
    } catch (e) {}
  };

  window.loadAdminUstav = async function() {
    var cont = document.getElementById("adm-ustav-list");
    if (!cont) return;
    try {
      var res = await fetch(API_BASE + "/api/ustav");
      var list = await res.json();
      cont.innerHTML = list.map(function(item) {
        return [
          '<div style="background:#020507; border:1px solid var(--line-soft); padding:8px 10px; display:flex; justify-content:space-between; align-items:flex-start;">',
          '  <div>',
          '    <b>' + item.num + ' ' + item.title + '</b> <span style="font-size:10px; color:var(--line);">[' + item.sectionId + ' | ' + item.tag + ']</span>',
          '    <div style="font-size:11.5px; color:var(--text); margin-top:2px;">' + item.text + '</div>',
          '  </div>',
          '  <div style="display:flex; gap:4px; margin-left:8px;">',
          '    <button type="button" class="dnp-action" style="margin:0; padding:2px 6px; font-size:10px;" onclick=\'editAdminUstav(' + JSON.stringify(item) + ')\'>ИЗМ</button>',
          '    <button type="button" class="dnp-action" style="margin:0; padding:2px 6px; font-size:10px; border-color:var(--danger); color:var(--danger);" onclick="deleteAdminUstav(\'' + item._id + '\')">УДЛ</button>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {}
  };

  window.editAdminUstav = function(item) {
    document.getElementById("adm-ustav-id").value = item._id;
    document.getElementById("adm-ustav-section").value = item.sectionId;
    document.getElementById("adm-ustav-num").value = item.num;
    document.getElementById("adm-ustav-tag").value = item.tag;
    document.getElementById("adm-ustav-title").value = item.title;
    document.getElementById("adm-ustav-text").value = item.text;
  };

  window.resetAdminUstavForm = function() {
    document.getElementById("adm-ustav-id").value = "";
    document.getElementById("adm-ustav-num").value = "";
    document.getElementById("adm-ustav-tag").value = "";
    document.getElementById("adm-ustav-title").value = "";
    document.getElementById("adm-ustav-text").value = "";
  };

  window.saveAdminUstav = async function() {
    var token = localStorage.getItem("dnp_auth_token");
    var id = document.getElementById("adm-ustav-id").value;
    var sectionId = document.getElementById("adm-ustav-section").value;
    var num = document.getElementById("adm-ustav-num").value.trim();
    var tag = document.getElementById("adm-ustav-tag").value.trim();
    var title = document.getElementById("adm-ustav-title").value.trim();
    var text = document.getElementById("adm-ustav-text").value.trim();
    if (!num || !title || !text) return;
    try {
      await fetch(API_BASE + "/api/admin/ustav/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ id: id, sectionId: sectionId, num: num, tag: tag, title: title, text: text })
      });
      resetAdminUstavForm();
      loadAdminUstav();
    } catch (e) {}
  };

  window.deleteAdminUstav = async function(id) {
    if (!confirm("Удалить этот пункт устава?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await fetch(API_BASE + "/api/admin/ustav/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      loadAdminUstav();
    } catch (e) {}
  };
  
})();