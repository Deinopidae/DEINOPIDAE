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
    }, 5000);

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
    if (!button.id) {
      button.id = "tab-" + screenName;
    }
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

  // Открытие экранов (Устав больше не закрывается при переходе в Бюрократию)
  window.openScreen = function(name) {
    if (isTransitioning) return;

    var targetPanel = root.querySelector('[data-screen-panel="' + name + '"]');
    if (!targetPanel) return;

    if (layout) {
      if (name === "database") {
        layout.classList.add("is-terminal-mode");
      } else {
        layout.classList.remove("is-terminal-mode");
      }
    }

    var currentPanel = root.querySelector(".dnp-screen.is-visible");

    function applyScreenSwitch() {
      var allPanels = root.querySelectorAll("[data-screen-panel]");
      allPanels.forEach(function (panel) {
        var isActive = panel === targetPanel;
        panel.classList.toggle("is-visible", isActive);
        if (isActive) {
          panel.removeAttribute("aria-hidden");
        } else {
          panel.setAttribute("aria-hidden", "true");
        }
      });

      var allButtons = root.querySelectorAll("[data-screen]");
      allButtons.forEach(function (button) {
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
      } else if (name === "admin-panel") {
        loadAdminTickets();
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

  // --- ЛОГИКА ТЕРМИНАЛА И БАЗЫ ДАННЫХ ---
  var termLoaded = false;
  var termBooting = false;
  var termStep = 0;
  var termTimer = null;
  var cmdHistory = [];
  var cmdHistoryIndex = -1;

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
    "xxartemrtxxx": { name: "xxartemrtxxx", title: "Лидер инженеров", rank: "Офицер", mp: "0/0", hours: "18:00", equipment: "42", coins: "42", activity: "0", quota_status: "ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "N/A", promotion: "Максимальное звание" },
    "egorik0130": { name: "EGORIK0130", title: "Аналитик инженеров", rank: "Офицер", mp: "0/0", hours: "24:00", equipment: "126", coins: "126", activity: "0", quota_status: "ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "N/A", promotion: "Максимальное звание" },
    "ceretow2222": { name: "ceretow2222", title: "Профессор инженеров", rank: "A RANK", mp: "0/0", hours: "14:00", equipment: "0", coins: "0", activity: "0", quota_status: "ВЫПОЛНЕНА", vacation: "НЕТ", penalties: "N/A", promotion: "Максимальное звание" }
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

  function initTerminalBoot() {
    var termTopTitle = document.getElementById("term-top-title");
    var termProgressLine = document.getElementById("term-progress-line");
    var termAscii = document.getElementById("term-ascii");
    var termPromptLine = document.getElementById("term-prompt-line");
    var termPromptLabel = document.getElementById("term-prompt-label");
    var termInput = document.getElementById("term-input");

    if (termPromptLabel) termPromptLabel.textContent = getPromptStr();
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

    if (termProgressLine) termProgressLine.textContent = "▶ CURRENT PROGRESS . . . " + str;
    if (termStep >= 10) {
      finishTerminalBoot();
      return;
    }
    termStep++;
    termTimer = setTimeout(runBootStep, 140);
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
    if (termAscii) { termAscii.textContent = asciiLogo; termAscii.style.display = "block"; }
    if (termPromptLabel) termPromptLabel.textContent = getPromptStr();
    if (termPromptLine) termPromptLine.style.display = "flex";
    if (termInput) termInput.focus({ preventScroll: true });
  }

  var termBody = document.getElementById("term-body");
  if (termBody) {
    termBody.addEventListener("click", function () {
      if (termBooting) finishTerminalBoot();
      else {
        var input = document.getElementById("term-input");
        if (input) input.focus({ preventScroll: true });
      }
    });
  }

  function printLine(text) {
    var termOutput = document.getElementById("term-output");
    if (!termOutput) return;
    var div = document.createElement("div");
    div.className = "dnp-term-resp-line";
    div.innerHTML = text;
    termOutput.appendChild(div);
    if (termBody) termBody.scrollTop = termBody.scrollHeight;
  }

  function executeCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    cmdHistory.push(cmd);
    cmdHistoryIndex = cmdHistory.length;
    printLine(getPromptStr() + " " + cmd);

    var parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    var first = (parts[0] || "").toUpperCase();

    if (first === "HELP") {
      printLine("HELP - Список команд");
      printLine("CLS / CLEAR - Очистить экран");
      printLine("STAFF <ник> - Личное дело сотрудника");
      printLine("GOTO <1-9> - Переход в раздел устава");
      return;
    }
    if (first === "CLS" || first === "CLEAR") {
      var termOutput = document.getElementById("term-output");
      if (termOutput) termOutput.innerHTML = "";
      return;
    }
    if (first === "STAFF") {
      var nick = (parts[1] || "").replace(/^"|"$/g, "").toLowerCase();
      var p = window.employeeDb[nick];
      if (p) {
        printLine("ПОЗЫВНОЙ: " + p.name + " | РАНГ: " + p.title + " [" + p.rank + "] | НОРМА: " + p.quota_status);
      } else {
        printLine("Сотрудник не найден в локальном реестре.");
      }
      return;
    }
    if (first === "GOTO") {
      var target = (parts[1] || "").toLowerCase();
      openScreen("ustav-0" + target);
      return;
    }
    printLine('Команда "' + cmd + '" не распознана. Введите "HELP".');
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
      }
    });
  }

  // --- ОЧИСТКА И ОТПРАВКА ОБРАЩЕНИЙ ---
  window.clearGuiForm = function() {
    var desc = document.getElementById("gui-form-desc");
    var links = document.getElementById("gui-form-links");
    var target = document.getElementById("gui-form-target");
    var rules = document.getElementById("gui-form-rules");
    var msg = document.getElementById("gui-form-status-msg");
    if (desc) desc.value = "";
    if (links) links.value = "";
    if (target) target.value = "";
    if (rules) rules.value = "";
    if (msg) msg.textContent = "";
  };

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
        window.clearGuiForm();
      } else {
        statusMsg.style.color = "var(--danger)";
        statusMsg.textContent = "[ОТКАЗ] " + (data.error || "Не удалось отправить");
      }
    } catch (e) {
      statusMsg.style.color = "var(--danger)";
      statusMsg.textContent = "[СБОЙ СЕТИ] Ошибка соединения с сервером.";
      if (window.setNetStatus) window.setNetStatus(false, "CONN_LOST");
    }
  };

  var submitBtn = document.getElementById("gui-form-submit-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", window.submitFormFromGui);
  }

  // --- ТИКЕТЫ ПОЛЬЗОВАТЕЛЯ ---
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
      if (!res.ok) throw new Error("HTTP " + res.status);
      var list = await res.json();

      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:13px; padding:12px 0;">Обращений нет.</div>';
        return;
      }

      cont.innerHTML = list.map(function(t) {
        var stClass = "st-pending";
        if (t.status === "В РАБОТЕ") stClass = "st-work";
        if (t.status === "ОДОБРЕНО") stClass = "st-ok";
        if (t.status === "ОТКЛОНЕНО") stClass = "st-reject";
        if (t.status === "УДАЛЕНО") stClass = "st-deleted";

        var dateSubmit = t.submittedAt ? new Date(t.submittedAt).toLocaleDateString() + " " + new Date(t.submittedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "—";
        var dateUpdate = t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() + " " + new Date(t.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "—";

        return [
          '<div class="dnp-ticket-card" onclick="this.classList.toggle(\'is-open\')">',
          '  <div class="dnp-ticket-header">',
          '    <div>',
          '      <b>' + t.type + ' <span style="color:var(--muted); font-size:11px;">(#' + t.reportId + ')</span></b>',
          '      <span style="color:var(--muted); font-size:11px; margin-left:8px;">' + dateSubmit + '</span>',
          '    </div>',
          '    <span class="dnp-badge ' + stClass + '">' + (t.status || "НА ПРОВЕРКЕ") + '</span>',
          '  </div>',
          '  <div class="dnp-ticket-history">',
          '    <div><span style="color:var(--line);">Суть:</span> ' + t.description + '</div>',
          t.links && t.links !== "Отсутствуют" ? '    <div><span style="color:var(--line);">Материалы:</span> <a href="' + t.links + '" target="_blank" class="dnp-brud-link">Открыть вложение</a></div>' : '',
          t.officer ? '    <div style="margin-top:4px; padding-top:6px; border-top:1px dashed var(--line-soft);"><span style="color:var(--line);">Офицер:</span> ' + t.officer + ' (' + dateUpdate + ')</div>' : '',
          t.officerComment ? '    <div class="dnp-ticket-verdict-box"><span style="color:var(--line);">Вердикт офицера:</span> <b style="color:#fff;">' + t.officerComment + '</b></div>' : '',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:12.5px;">Сбой при загрузке обращений.</div>';
    }
  };

  // --- УВЕДОМЛЕНИЯ С УДАЛЕНИЕМ ---
  window.deleteNotification = async function(e, id) {
    e.stopPropagation();
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;
    try {
      await fetch(API_BASE + "/api/notifications/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      loadNotifications();
    } catch (err) {}
  };

  window.clearAllNotifications = async function() {
    if (!confirm("Удалить все уведомления?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;
    try {
      await fetch(API_BASE + "/api/notifications", {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      loadNotifications();
    } catch (err) {}
  };

  window.loadNotifications = async function() {
    var cont = document.getElementById("notifications-list-container");
    var token = localStorage.getItem("dnp_auth_token");
    if (!token || !cont) return;

    try {
      var res = await fetch(API_BASE + "/api/notifications/my", {
        headers: { "Authorization": "Bearer " + token }
      });
      var list = await res.json();
      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:13px; padding:12px 0;">Уведомлений нет.</div>';
        return;
      }
      cont.innerHTML = list.map(function(n) {
        var unreadClass = n.isRead ? "" : "is-unread";
        var dateStr = new Date(n.createdAt).toLocaleDateString() + " " + new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return [
          '<div class="dnp-notif-box ' + unreadClass + '" onclick="markNotificationRead(\'' + n._id + '\')">',
          '  <div class="dnp-notif-top">',
          '    <b>' + n.title + '</b>',
          '    <div style="display:flex; align-items:center; gap:8px;">',
          '      <span class="dnp-notif-time">' + dateStr + '</span>',
          '      <button type="button" class="dnp-notif-del-btn" onclick="deleteNotification(event, \'' + n._id + '\')">✕</button>',
          '    </div>',
          '  </div>',
          '  <div class="dnp-notif-msg">' + n.message + '</div>',
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

  // --- ПРОВЕРКА ПРАВ ОФИЦЕРА (JEISO УБРАН ИЗ DEFAULT) ---
  async function checkOfficerStatus() {
    var navBtn = document.getElementById("dnp-nav-admin") || document.querySelector('[data-screen="admin-panel"]');
    if (!navBtn) return;

    var defaultOfficers = ["xxartemrtxxx", "tds_masterfarm", "egorik0130"];
    var rawUser = localStorage.getItem("dnp_active_user");
    var token = localStorage.getItem("dnp_auth_token");

    if (rawUser) {
      try {
        var u = JSON.parse(rawUser);
        var rNick = (u.roblox || "").trim().toLowerCase();
        var uNick = (u.username || "").trim().toLowerCase();
        if (defaultOfficers.indexOf(rNick) !== -1 || defaultOfficers.indexOf(uNick) !== -1) {
          navBtn.style.display = "grid";
        }
      } catch (e) {}
    }

    if (!token) return;

    try {
      var res = await fetch(API_BASE + "/api/admin/check", {
        headers: { "Authorization": "Bearer " + token }
      });
      var data = await res.json();
      if (data && data.isOfficer) {
        navBtn.style.display = "grid";
      } else if (rawUser) {
        var u2 = JSON.parse(rawUser);
        var rNick2 = (u2.roblox || "").trim().toLowerCase();
        var uNick2 = (u2.username || "").trim().toLowerCase();
        if (defaultOfficers.indexOf(rNick2) === -1 && defaultOfficers.indexOf(uNick2) === -1) {
          navBtn.style.display = "none";
        }
      }
    } catch (err) {}
  }

  checkOfficerStatus();
  window.addEventListener("DOMContentLoaded", checkOfficerStatus);

  document.querySelectorAll(".dnp-admin-tab-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".dnp-admin-tab-btn").forEach(b => b.classList.remove("is-active"));
      document.querySelectorAll(".dnp-admin-panel-view").forEach(v => v.classList.remove("is-active"));
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

    cont.innerHTML = '<div style="color:var(--muted); font-size:12px;">Загрузка тикетов...</div>';
    try {
      var res = await fetch(API_BASE + "/api/admin/tickets", {
        headers: { "Authorization": "Bearer " + token }
      });
      var list = await res.json();
      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:12.5px;">Обращений нет.</div>';
        return;
      }
      cont.innerHTML = list.map(function(t) {
        var isClosed = (t.status === 'ОДОБРЕНО' || t.status === 'ОТКЛОНЕНО');
        var stClass = 'st-pending';
        if (t.status === 'В РАБОТЕ') stClass = 'st-work';
        if (t.status === 'ОДОБРЕНО') stClass = 'st-ok';
        if (t.status === 'ОТКЛОНЕНО') stClass = 'st-reject';

        var actionsHtml = '';
        if (isClosed) {
          actionsHtml = [
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">',
            '  <div class="dnp-ticket-verdict-box" style="flex:1; margin-right:12px;">',
            '    <span style="color:var(--line);">Решение (' + (t.officer || 'Офицер') + '):</span> <b style="color:#fff;">' + (t.officerComment || 'Без комментария') + '</b>',
            '  </div>',
            '  <button type="button" class="dnp-action is-danger" style="margin:0;" onclick="deleteAdminTicket(\'' + t.reportId + '\')">УДАЛИТЬ</button>',
            '</div>'
          ].join('');
        } else {
          actionsHtml = [
            '<div style="display:flex; gap:8px; margin-top:8px; align-items:center; flex-wrap:wrap;">',
            '  <input type="text" id="adm-comment-' + t.reportId + '" placeholder="Комментарий / вердикт офицера" value="' + (t.officerComment || '') + '" class="dnp-admin-input" style="flex:1; min-width:200px;">',
            '  <button type="button" class="dnp-action" style="margin:0; border-color:var(--ok); color:var(--ok);" onclick="respondAdminTicket(\'' + t.reportId + '\', \'ОДОБРЕНО\')">ОДОБРИТЬ</button>',
            '  <button type="button" class="dnp-action is-danger" style="margin:0;" onclick="respondAdminTicket(\'' + t.reportId + '\', \'ОТКЛОНЕНО\')">ОТКЛОНИТЬ</button>',
            '  <button type="button" class="dnp-action is-secondary" style="margin:0;" onclick="deleteAdminTicket(\'' + t.reportId + '\')">УДАЛИТЬ</button>',
            '</div>'
          ].join('');
        }

        return [
          '<div style="background:var(--panel-2); border:1px solid var(--line-soft); padding:12px; display:flex; flex-direction:column; gap:6px;">',
          '  <div style="display:flex; justify-content:space-between; align-items:center;">',
          '    <div>',
          '      <b style="color:#fff; font-size:13px;">' + t.type + ' <span style="color:var(--muted); font-size:11px;">(#' + t.reportId + ')</span></b>',
          '      <span style="color:var(--line); font-size:11.5px; margin-left:8px;">' + t.username + ' (' + t.roblox + ')</span>',
          '    </div>',
          '    <span class="dnp-badge ' + stClass + '">' + t.status + '</span>',
          '  </div>',
          '  <div style="font-size:12.5px; color:var(--text); line-height:1.5;">' + t.description + '</div>',
          t.links && t.links !== 'Отсутствуют' ? '<div style="font-size:11.5px;"><a href="' + t.links + '" target="_blank" class="dnp-brud-link">Материалы</a></div>' : '',
          actionsHtml,
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:12px;">Ошибка загрузки тикетов.</div>';
    }
  };

  window.respondAdminTicket = async function(reportId, status) {
    var token = localStorage.getItem("dnp_auth_token");
    var commentInput = document.getElementById("adm-comment-" + reportId);
    var comment = commentInput ? commentInput.value.trim() : "";
    try {
      var res = await fetch(API_BASE + "/api/admin/tickets/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ reportId: reportId, status: status, officerComment: comment })
      });
      var data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        loadAdminTickets();
      } else {
        alert("Ошибка: " + (data.error || "Не удалось изменить статус"));
      }
    } catch (e) {}
  };

  window.deleteAdminTicket = async function(reportId) {
    if (!confirm("Удалить обращение #" + reportId + "? В Discord статус изменится на УДАЛЕНО.")) return;
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
    try {
      var res = await fetch(API_BASE + "/api/admin/users", {
        headers: { "Authorization": "Bearer " + token }
      });
      var users = await res.json();
      tbody.innerHTML = users.map(function(u) {
        var actClass = u.activityStatus === 'В активе' ? 'st-ok' : 'st-pending';
        return [
          '<tr>',
          '  <td><b>' + (u.displayName || u.username) + '</b></td>',
          '  <td>' + u.roblox + '</td>',
          '  <td><span class="dnp-badge ' + actClass + '">' + (u.activityStatus || 'В активе') + '</span></td>',
          '  <td>' + new Date(u.registeredAt).toLocaleDateString() + '</td>',
          '  <td><button type="button" class="dnp-action is-danger" style="margin:0; padding:4px 8px; font-size:10.5px;" onclick="deleteAdminUser(\'' + u._id + '\')">УДАЛИТЬ</button></td>',
          '</tr>'
        ].join('');
      }).join('');
    } catch (e) {}
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
          '<div style="background:var(--panel-2); border:1px solid var(--line-soft); padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">',
          '  <div><b style="color:#fff;">' + o.roblox + '</b><span style="font-size:11px; color:var(--muted); margin-left:10px;">(Назначил: ' + o.addedBy + ')</span></div>',
          '  <button type="button" class="dnp-action is-danger" style="margin:0; padding:3px 8px; font-size:10.5px;" onclick="removeAdminOfficer(\'' + o.roblox + '\')">СНЯТЬ</button>',
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
      var res = await fetch(API_BASE + "/api/admin/officers/remove", {
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
    cont.innerHTML = '<div style="color:var(--muted); font-size:12px;">Загрузка статей устава...</div>';
    try {
      var res = await fetch(API_BASE + "/api/ustav");
      var list = await res.json();
      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:12px;">Дополнительных статей пока нет.</div>';
        return;
      }
      cont.innerHTML = list.map(function(item) {
        var borderColor = item.borderColor || 'var(--line-soft)';
        var textColor = item.textColor || 'var(--text)';
        var bgColor = item.highlightColor || 'var(--panel-2)';
        return [
          '<div style="background:' + bgColor + '; border:1px solid var(--line-soft); border-left:3px solid ' + borderColor + '; padding:10px 14px; display:flex; justify-content:space-between; align-items:flex-start;">',
          '  <div>',
          '    <b style="color:#fff;">' + item.num + ' ' + item.title + '</b> <span style="font-size:10.5px; color:var(--line); margin-left:6px;">[' + item.sectionId + ' | ' + item.tag + ']</span>',
          '    <div style="font-size:12px; color:' + textColor + '; margin-top:4px; line-height:1.5;">' + item.text + '</div>',
          '  </div>',
          '  <div style="display:flex; gap:6px; margin-left:12px; flex-shrink:0;">',
          '    <button type="button" class="dnp-action is-secondary" style="margin:0; padding:4px 8px; font-size:10.5px;" onclick=\'openFloatingUstavEditorWithItem(' + JSON.stringify(item) + ')\'>ИЗМЕНИТЬ</button>',
          '    <button type="button" class="dnp-action is-danger" style="margin:0; padding:4px 8px; font-size:10.5px;" onclick="deleteAdminUstav(\'' + item._id + '\')">УДАЛИТЬ</button>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:12px;">Ошибка сети.</div>';
    }
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
      loadDynamicUstav();
    } catch (e) {}
  };

  var isEditorModeActive = false;
  var currentEditedElement = null;

  window.toggleUstavEditorMode = function(forceState) {
    var pda = document.getElementById("dnp-pda");
    var brand = document.getElementById("dnp-top-brand");
    var dock = document.getElementById("dnp-editor-dock");
    if (!pda || !brand || !dock) return;

    isEditorModeActive = typeof forceState === "boolean" ? forceState : !isEditorModeActive;

    if (isEditorModeActive) {
      pda.classList.add("dnp-editor-mode");
      brand.innerHTML = '<strong>DEINOPIDAE INDUSTRIES</strong> <span class="dnp-editor-tag">[РЕЖИМ РЕДАКТОРА]</span> <span>Департамент S.E. · Kurodzakura</span>';
      dock.style.display = "flex";
      openScreen("ustav-01");
      enableInlineEditing();
    } else {
      pda.classList.remove("dnp-editor-mode");
      brand.innerHTML = '<strong>DEINOPIDAE / ДЕИНОПИДЫ</strong> <span>Департамент S.E. · Kurodzakura</span>';
      dock.style.display = "none";
      disableInlineEditing();
    }
  };

  function enableInlineEditing() {
    var ustavScreens = document.querySelectorAll('[data-screen-panel^="ustav-"]');
    ustavScreens.forEach(function(screen) {
      var editables = screen.querySelectorAll(".dnp-module-title b, .dnp-module-title span, .dnp-module-title em, .dnp-module p, .dnp-list li, .dnp-rank-info b, .dnp-rank-info span");
      editables.forEach(function(el) {
        el.setAttribute("contenteditable", "true");
        el.addEventListener("focus", function() {
          currentEditedElement = el.closest(".dnp-module, .dnp-rank-block, li") || el;
        });
      });
    });
  }

  function disableInlineEditing() {
    var editables = document.querySelectorAll('[contenteditable="true"]');
    editables.forEach(function(el) {
      el.removeAttribute("contenteditable");
    });
  }

  window.docFormat = function(cmd, value) {
    document.execCommand(cmd, false, value || null);
  };

  window.docSetFont = function(fontName) {
    document.execCommand("fontName", false, fontName);
  };

  window.docApplyTextColor = function(color) {
    document.execCommand("foreColor", false, color);
  };

  window.docApplyBorderColor = function(color) {
    if (currentEditedElement) {
      currentEditedElement.style.borderLeftColor = color;
    }
  };

  window.docApplyBgColor = function(color) {
    if (currentEditedElement) {
      currentEditedElement.style.backgroundColor = color;
    }
  };

  window.docInsertItem = function(type) {
    var activePanel = document.querySelector(".dnp-screen.is-visible .dnp-screen-content");
    if (!activePanel) return;

    var el = document.createElement("div");

    if (type === "card") {
      el.className = "dnp-rank-block lr";
      el.style.marginBottom = "10px";
      el.innerHTML = '<div class="dnp-rank-info"><b contenteditable="true">НОВОЕ ЗВАНИЕ / КАРТОЧКА</b><span contenteditable="true">Описание требований и нормативов...</span></div>';
    } else if (type === "module") {
      el.className = "dnp-module";
      el.innerHTML = '<div class="dnp-module-title"><span contenteditable="true">X.X</span><b contenteditable="true">НОВЫЙ ПУНКТ</b><em contenteditable="true">ACTIVE</em></div><p contenteditable="true">Содержание нового пункта устава...</p>';
    } else if (type === "list") {
      el.className = "dnp-list";
      el.innerHTML = '<li contenteditable="true">Новый пункт перечисления...</li><li contenteditable="true">Второй пункт перечисления...</li>';
    }

    var note = activePanel.querySelector(".dnp-brud-note");
    if (note) activePanel.insertBefore(el, note);
    else activePanel.appendChild(el);

    enableInlineEditing();
  };

  window.moveActiveSection = async function(direction) {
    var activeBtn = document.querySelector(".dnp-subnav button.is-active");
    if (!activeBtn) return;

    var secId = activeBtn.getAttribute("data-screen");
    var subnav = document.querySelector(".dnp-subnav");
    var buttons = Array.from(subnav.querySelectorAll("button"));
    var index = buttons.indexOf(activeBtn);

    if (direction === -1 && index > 0) {
      subnav.insertBefore(activeBtn, buttons[index - 1]);
    } else if (direction === 1 && index < buttons.length - 1) {
      subnav.insertBefore(buttons[index + 1], activeBtn);
    }

    await saveSectionsOrder();
  };

  async function saveSectionsOrder() {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;

    var buttons = Array.from(document.querySelectorAll(".dnp-subnav button"));
    for (var i = 0; i < buttons.length; i++) {
      var sId = buttons[i].getAttribute("data-screen");
      var sTitle = buttons[i].textContent.trim();
      await fetch(API_BASE + "/api/admin/ustav/sections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ sectionId: sId, title: sTitle, order: i + 1 })
      });
    }
  }

  window.saveUstavChanges = async function() {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) {
      alert("Требуется авторизация офицера.");
      return;
    }

    var activePanel = document.querySelector(".dnp-screen.is-visible");
    if (!activePanel) return;

    var secId = activePanel.getAttribute("data-screen-panel");
    var contentHtml = activePanel.querySelector(".dnp-screen-content").innerHTML;

    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/section-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ sectionId: secId, html: contentHtml })
      });

      if (res.ok) {
        alert("Изменения успешно сохранены в базе данных!");
      } else {
        alert("Ошибка при сохранении на сервере.");
      }
    } catch (e) {
      alert("Сбой соединения с сервером.");
    }
  };

  async function loadDynamicUstav() {
    try {
      var res = await fetch(API_BASE + "/api/ustav/all-content");
      if (!res.ok) return;
      var sections = await res.json();
      if (!Array.isArray(sections)) return;

      sections.forEach(function(sec) {
        var panel = document.querySelector('[data-screen-panel="' + sec.sectionId + '"] .dnp-screen-content');
        if (panel && sec.html) {
          panel.innerHTML = sec.html;
        }
      });
      if (isEditorModeActive) enableInlineEditing();
    } catch (e) {}
  }

  loadDynamicUstav();
})();