(function () {
  var API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? ""
    : "https://deinopidae-api.onrender.com";

  // 5. РЕАЛЬНЫЙ ЗАГРУЗЧИК (ПО АССЕТАМ + СКИП РОВНО ЧЕРЕЗ 6 СЕКУНД)
  var loader = document.getElementById("dnp-loader");
  var loaderBar = document.getElementById("loader-bar");
  var loaderPercent = document.getElementById("loader-percent");
  var loaderPin = document.getElementById("loader-pin");
  var loaderBg = document.getElementById("loader-bg");
  var loaderWipe = document.getElementById("loader-wipe");
  var loaderContent = document.getElementById("loader-content");

  if (loader && loaderBar && loaderPercent) {
    var currentProgress = 0;
    var targetProgress = 10;
    var isDone = false;

    // Сбор реальных ассетов
    var images = Array.from(document.images || []);
    var totalItems = images.length + 2; // +1 DOM, +1 load
    var loadedItems = 0;

    function onItemLoaded() {
      loadedItems++;
      var pct = Math.round((loadedItems / totalItems) * 90);
      targetProgress = Math.max(targetProgress, pct);
    }

    images.forEach(function(img) {
      if (img.complete) onItemLoaded();
      else {
        img.addEventListener("load", onItemLoaded, { once: true });
        img.addEventListener("error", onItemLoaded, { once: true });
      }
    });

    document.addEventListener("DOMContentLoaded", function() {
      onItemLoaded();
      targetProgress = Math.max(targetProgress, 50);
    });

    window.addEventListener("load", function() {
      onItemLoaded();
      targetProgress = 100;
    });

    function renderLoaderLoop() {
      if (isDone) return;

      if (currentProgress < targetProgress) {
        var diff = targetProgress - currentProgress;
        currentProgress += Math.max(0.4, diff * 0.08);
      }
      if (currentProgress >= 100) currentProgress = 100;

      var progFloor = Math.floor(currentProgress);
      loaderPercent.textContent = progFloor;
      loaderBar.style.height = currentProgress + "%";

      if (loaderPin) {
        var trackHeight = loader.clientHeight || window.innerHeight;
        var currentY = (trackHeight * currentProgress) / 100;
        loaderPin.style.top = Math.min(Math.max(currentY, 28), trackHeight - 48) + "px";
      }

      if (loaderBg) {
        var blurVal = (20 * (1 - currentProgress / 100)).toFixed(1);
        loaderBg.style.filter = "blur(" + blurVal + "px)";
      }

      if (currentProgress >= 100) {
        finishLoader();
        return;
      }

      requestAnimationFrame(renderLoaderLoop);
    }

    function finishLoader() {
      if (isDone) return;
      isDone = true;
      loaderPercent.textContent = "100";
      loaderBar.style.height = "100%";
      if (loaderBg) loaderBg.style.filter = "blur(0px)";

      setTimeout(function () {
        if (loaderWipe) loaderWipe.classList.add("wipe-in");
        setTimeout(function () {
          if (loaderContent) loaderContent.style.opacity = "0";
          if (loaderBg) loaderBg.style.opacity = "0";
          if (loaderWipe) {
            loaderWipe.classList.remove("wipe-in");
            loaderWipe.classList.add("wipe-out");
          }
          setTimeout(function () {
            loader.style.opacity = "0";
            loader.style.pointerEvents = "none";
            setTimeout(function () { loader.style.display = "none"; }, 250);
          }, 350);
        }, 300);
      }, 100);
    }

    requestAnimationFrame(renderLoaderLoop);

    // Скип ровно через 6 секунд при любых зависаниях
    setTimeout(function() {
      targetProgress = 100;
      finishLoader();
    }, 6000);

    loader.addEventListener("click", function() {
      finishLoader();
    });
  }

  window.navPromptAddSection = async function() {
    var id = prompt("Введите идентификатор раздела (например: ustav-10):");
    if (!id) return;
    var title = prompt("Введите название раздела в меню (например: Раздел 10 Дополнительно):");
    if (!title) return;

    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/sections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ sectionId: id.trim().toLowerCase(), title: title.trim(), order: allUstavSections.length + 1 })
      });
      if (res.ok) {
        alert("Раздел добавлен!");
        loadUstavSections();
      }
    } catch (e) {}
  };

  window.navDeleteSection = async function(secId) {
    if (!confirm("Удалить раздел " + secId + "?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/sections/" + secId, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.ok) {
        loadUstavSections();
      } else {
        alert("Нельзя удалить базовый раздел.");
      }
    } catch (e) {}
  };

  // 3. РЕНДЕР НАВИГАЦИИ С КРЕСТИКАМИ В РЕЖИМЕ РЕДАКТОРА
  var adminTicketTab = 'active';
  var allAdminTickets = [];

  window.switchAdminTicketTab = function(tab) {
    adminTicketTab = tab;
    var bAct = document.getElementById("btn-tickets-active");
    var bArc = document.getElementById("btn-tickets-archive");
    if (bAct && bArc) {
      bAct.classList.toggle("is-active", tab === 'active');
      bArc.classList.toggle("is-active", tab === 'archive');
    }
    renderAdminTicketsList();
  };

  window.loadAdminTickets = async function() {
    var cont = document.getElementById("adm-tickets-list");
    var token = localStorage.getItem("dnp_auth_token");
    if (!cont || !token) return;

    cont.innerHTML = '<div style="color:var(--muted); font-size:12px;">Загрузка тикетов...</div>';
    try {
      var res = await fetch(API_BASE + "/api/admin/tickets", {
        headers: { "Authorization": "Bearer " + token }
      });
      allAdminTickets = await res.json();
      renderAdminTicketsList();
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:12px;">Ошибка загрузки тикетов.</div>';
    }
  };

  function renderAdminTicketsList() {
    var cont = document.getElementById("adm-tickets-list");
    if (!cont) return;

    var activeList = allAdminTickets.filter(function(t) { return t.status === 'НА ПРОВЕРКЕ' || t.status === 'В РАБОТЕ'; });
    var archiveList = allAdminTickets.filter(function(t) { return t.status === 'ОДОБРЕНО' || t.status === 'ОТКЛОНЕНО' || t.status === 'УДАЛЕНО'; });

    var cntAct = document.getElementById("adm-t-active-count");
    var cntArc = document.getElementById("adm-t-archive-count");
    if (cntAct) cntAct.textContent = activeList.length;
    if (cntArc) cntArc.textContent = archiveList.length;

    var list = adminTicketTab === 'active' ? activeList : archiveList;

    if (list.length === 0) {
      cont.innerHTML = '<div style="color:var(--muted); font-size:12.5px; padding:10px 0;">Тикетов в этой категории нет.</div>';
      return;
    }

    cont.innerHTML = list.map(function(t) {
      var isClosed = (t.status === 'ОДОБРЕНО' || t.status === 'ОТКЛОНЕНО' || t.status === 'УДАЛЕНО');
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
        t.links && t.links !== 'Отсутствуют' ? '<div style="font-size:11.5px;"><a href="' + t.links + '" target="_blank" class="dnp-brud-link">Материалы ↗</a></div>' : '',
        actionsHtml,
        '</div>'
      ].join('');
    }).join('');
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
      if (panelId === "database" || panelId === "forms-gui" || panelId === "tickets" || panelId === "notifications" || panelId === "admin-panel") return;

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
          snippet: "Норма: " + emp.quota_status + " | Часы: " + emp.hours,
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
    } else {
      printLine('По запросу "' + q + '" данных не обнаружено.');
    }
  }

  function executeCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) return;

    cmdHistory.push(cmd);
    cmdHistoryIndex = cmdHistory.length;
    printLine(getPromptStr() + " " + cmd);

    var parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    var first = (parts[0] || "").toUpperCase();

    if (first === "D" && parts.length > 1) {
      parts.shift();
      first = (parts[0] || "").toUpperCase();
    }

    if (first === "STAFF") {
      var nick = (parts[1] || "").replace(/^"|"$/g, "").toLowerCase();
      if (!nick) {
        printLine("Синтаксис: STAFF <никнейм>");
        return;
      }
      var p = window.employeeDb[nick];
      if (p) {
        printLine("===ЛИЧНОЕ ДЕЛО СОТРУДНИКА===");
        printLine("  ПОЗЫВНОЙ / НИК    : " + p.name);
        printLine("  ЗВАНИЕ / РАНГ     : " + p.title + " [" + p.rank + "]");
        printLine("  НОРМАТИВ          : МП: " + p.mp + " | Часы: " + p.hours + " | Оборудование: " + p.equipment);
        printLine("  СТАТУС НОРМЫ      : " + p.quota_status);
        printLine("  ПОВЫШЕНИЕ         : " + p.promotion);
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
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
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
      var data = await res.json().catch(function() { return {}; });
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
  var _ustavSnapshot = {};

  function takeUstavSnapshot() {
    _ustavSnapshot = {};
    document.querySelectorAll('[data-screen-panel^="ustav-"]').forEach(function(sec) {
      var id = sec.getAttribute("data-screen-panel");
      var content = sec.querySelector(".dnp-screen-content");
      if (content) _ustavSnapshot[id] = content.innerHTML;
    });
  }

  function restoreUstavSnapshot() {
    Object.keys(_ustavSnapshot).forEach(function(id) {
      var sec = document.querySelector('[data-screen-panel="' + id + '"] .dnp-screen-content');
      if (sec && _ustavSnapshot[id]) sec.innerHTML = _ustavSnapshot[id];
    });
  }

  window.toggleUstavEditorMode = async function(forceState) {
    var pda = document.getElementById("dnp-pda");
    var brand = document.getElementById("dnp-top-brand");
    var dock = document.getElementById("dnp-editor-dock");
    if (!pda || !brand || !dock) return;

    var targetState = typeof forceState === "boolean" ? forceState : !isEditorModeActive;

    if (targetState) {
      var token = localStorage.getItem("dnp_auth_token");
      if (!token) {
        alert("Доступ ограничен. Войдите в Личный кабинет под учетной записью офицера.");
        return;
      }
      try {
        var chk = await fetch(API_BASE + "/api/admin/check", {
          headers: { "Authorization": "Bearer " + token }
        });
        var chkData = await chk.json();
        if (!chkData || !chkData.isOfficer) {
          alert("Отказ доступа: ваш аккаунт не обладает правами офицера.");
          return;
        }
      } catch (err) {
        alert("Сбой проверки авторизации на сервере.");
        return;
      }

      takeUstavSnapshot();
      isEditorModeActive = true;
      pda.classList.add("dnp-editor-mode");
      brand.innerHTML = '<strong>DEINOPIDAE INDUSTRIES</strong> <span class="dnp-editor-tag">[РЕЖИМ РЕДАКТОРА]</span> <span>Департамент S.E. · Kurodzakura</span>';
      dock.style.display = "flex";
      openScreen("ustav-01");
      enableInlineEditing();
    } else {
      restoreUstavSnapshot();
      isEditorModeActive = false;
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
    document.querySelectorAll('[contenteditable="true"]').forEach(function(el) {
      el.removeAttribute("contenteditable");
    });
  }

  window.docDeleteCurrentItem = function() {
    if (!currentEditedElement) {
      alert("Сначала кликните по блоку, который хотите удалить.");
      return;
    }
    if (confirm("Удалить этот блок из раздела?")) {
      currentEditedElement.remove();
      currentEditedElement = null;
    }
  };

  // 1. Форматирование текста и вставка списков

  window.docFormat = function(cmd, value) {
    if (cmd === 'insertUnorderedList') {
      window.docInsertItem('list');
      return;
    }
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
      el = document.createElement("ul");
      el.className = "dnp-list";
      el.innerHTML = '<li contenteditable="true">Первый пункт списка...</li><li contenteditable="true">Второй пункт списка...</li>';
    }

    var note = activePanel.querySelector(".dnp-brud-note");
    if (note) activePanel.insertBefore(el, note);
    else activePanel.appendChild(el);

    enableInlineEditing();
  };

  window.moveActiveSection = async function(direction) {
    var activeBtn = document.querySelector(".dnp-subnav button.is-active");
    if (!activeBtn) return;

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
        // Обновляем базовый снимок, чтобы выход теперь сохранял этот вид
        takeUstavSnapshot();
        alert("Изменения раздела " + secId + " сохранены в базе!");
        loadUstavHistory();
      } else {
        alert("Ошибка при сохранении на сервере.");
      }
    } catch (e) {
      alert("Сбой соединения с сервером.");
    }
  };

  window.loadUstavHistory = async function() {
    var cont = document.getElementById("adm-ustav-history-list");
    var token = localStorage.getItem("dnp_auth_token");
    if (!cont || !token) return;

    cont.innerHTML = '<div style="color:var(--muted); font-size:11.5px;">Загрузка истории ревизий...</div>';
    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/history", {
        headers: { "Authorization": "Bearer " + token }
      });
      var list = await res.json();
      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:12px;">История правок пуста. Все разделы в исходном состоянии.</div>';
        return;
      }

      cont.innerHTML = list.map(function(rev) {
        var dateStr = new Date(rev.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        return [
          '<div style="background:var(--panel-2); border:1px solid var(--line-soft); border-left:3px solid #00f0ff; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">',
          '  <div>',
          '    <b style="color:#fff; font-size:12px;">[' + rev.sectionId + ']</b>',
          '    <span style="color:var(--line); font-size:11px; margin-left:8px;">Офицер: ' + rev.author + '</span>',
          '    <span style="color:var(--muted); font-size:10.5px; margin-left:8px;">(' + dateStr + ')</span>',
          '  </div>',
          '  <div style="display:flex; gap:6px;">',
          '    <button type="button" class="dnp-action is-secondary" style="margin:0; padding:3px 8px; font-size:10.5px;" onclick="revertUstavRevision(\'' + rev._id + '\')">ОТКАТИТЬ</button>',
          '    <button type="button" class="dnp-action is-danger" style="margin:0; padding:3px 8px; font-size:10.5px;" onclick="deleteUstavRevisionRecord(\'' + rev._id + '\')">✕</button>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:11.5px;">Ошибка загрузки истории правок.</div>';
    }
  };

  window.revertUstavRevision = async function(revId) {
    if (!confirm("Откатить состояние раздела к этой ревизии?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/revert/" + revId, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.ok) {
        alert("Раздел успешно откачен!");
        loadDynamicUstav();
        loadUstavHistory();
      }
    } catch (e) {
      alert("Ошибка сети");
    }
  };

  window.deleteUstavRevisionRecord = async function(revId) {
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await fetch(API_BASE + "/api/admin/ustav/history/" + revId, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      loadUstavHistory();
    } catch (e) {}
  };

  window.resetAllUstavFactory = async function() {
    if (!confirm("ВНИМАНИЕ! Вы действительно хотите удалить ВСЕ правки устава и сбросить его до начального заводского состояния?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/reset-all", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.ok) {
        alert("Устав успешно сброшен к исходному заводскому состоянию!");
        location.reload();
      }
    } catch (e) {
      alert("Сбой сброса");
    }
  };

  window.adminCreateSection = async function() {
    var id = (document.getElementById("adm-new-sec-id")?.value || "").trim().toLowerCase();
    var title = (document.getElementById("adm-new-sec-title")?.value || "").trim();
    var order = parseInt(document.getElementById("adm-new-sec-order")?.value, 10);
    if (!id || !title) return alert("Заполните ID и название раздела");

    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/sections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ sectionId: id, title: title, order: isNaN(order) ? 99 : order })
      });
      if (res.ok) {
        alert("Раздел создан!");
        document.getElementById("adm-new-sec-id").value = "";
        document.getElementById("adm-new-sec-title").value = "";
        loadUstavSections();
      }
    } catch (e) {}
  };

  window.adminDeleteSection = async function(secId) {
    if (!confirm("Удалить раздел " + secId + "?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/sections/" + secId, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.ok) {
        loadUstavSections();
      } else {
        alert("Нельзя удалить базовый раздел.");
      }
    } catch (e) {}
  };

  function renderAdminSectionsList() {
    var box = document.getElementById("adm-sections-list-box");
    if (!box) return;
    box.innerHTML = allUstavSections.map(function(s) {
      return [
        '<div style="background:#050a0d; border:1px solid var(--line-soft); padding:6px 10px; display:flex; justify-content:space-between; align-items:center;">',
        '  <span style="font-size:12px; color:#fff;"><b>' + s.title + '</b> <em style="font-size:10px; color:var(--muted);">[' + s.sectionId + ']</em></span>',
        s.isCustom ? '  <button type="button" class="dnp-action is-danger" style="margin:0; padding:2px 6px; font-size:10px;" onclick="adminDeleteSection(\'' + s.sectionId + '\')">УДАЛИТЬ</button>' : '<span style="font-size:10px; color:var(--muted);">[БАЗОВЫЙ]</span>',
        '</div>'
      ].join('');
    }).join('');
  }

  var DEFAULT_SECTIONS = [
    { sectionId: "ustav-01", title: "Раздел 1 Основа", headTitle: "Раздел 1 — Основа", order: 1 },
    { sectionId: "ustav-02", title: "Раздел 2 Правила", headTitle: "Раздел 2 — Правила", order: 2 },
    { sectionId: "ustav-03", title: "Раздел 3 Иерархия и повышения", headTitle: "Раздел 3 — Иерархия и повышения", order: 3 },
    { sectionId: "ustav-04", title: "Раздел 4 Норма", headTitle: "Раздел 4 — Норма", order: 4 },
    { sectionId: "ustav-05", title: "Раздел 5 Задания", headTitle: "Раздел 5 — Задания", order: 5 },
    { sectionId: "ustav-06", title: "Раздел 6 Проверки и лекции", headTitle: "Раздел 6 — Проверки и лекции", order: 6 },
    { sectionId: "ustav-07", title: "Раздел 7 Активности", headTitle: "Раздел 7 — Активности", order: 7 },
    { sectionId: "ustav-08", title: "Раздел 8 Прочее", headTitle: "Раздел 8 — Прочее", order: 8 },
    { sectionId: "ustav-09", title: "Раздел 9 Конец", headTitle: "Раздел 9 — Конец", order: 9 }
  ];
  var allUstavSections = DEFAULT_SECTIONS.slice();

  async function loadUstavSections() {
    try {
      var res = await fetch(API_BASE + "/api/ustav/sections");
      if (res.ok) {
        var list = await res.json();
        if (Array.isArray(list) && list.length > 0) allUstavSections = list;
      }
    } catch (e) {}
    renderUstavNavigation();
    renderAdminSectionsList();
  }

  function renderUstavNavigation() {
    var subnav = document.querySelector(".dnp-subnav");
    if (!subnav || allUstavSections.length === 0) return;

    allUstavSections.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).forEach(function(sec) {
      var btn = subnav.querySelector('[data-screen="' + sec.sectionId + '"]');
      if (btn) {
        btn.textContent = sec.title;
      } else {
        var newBtn = document.createElement("button");
        newBtn.type = "button";
        newBtn.setAttribute("data-screen", sec.sectionId);
        newBtn.textContent = sec.title;
        newBtn.addEventListener("click", function() { openScreen(sec.sectionId); });
        subnav.appendChild(newBtn);
      }

      var panel = document.querySelector('[data-screen-panel="' + sec.sectionId + '"]');
      if (panel) {
        var headH1 = panel.querySelector(".dnp-screen-head h1");
        if (headH1) headH1.textContent = sec.headTitle || sec.title;
      } else {
        var main = document.querySelector("main.dnp-main");
        if (main) {
          var newSec = document.createElement("section");
          newSec.className = "dnp-screen";
          newSec.setAttribute("data-screen-panel", sec.sectionId);
          newSec.innerHTML = [
            '<div class="dnp-screen-head"><h1>' + (sec.headTitle || sec.title) + '</h1></div>',
            '<div class="dnp-screen-content">',
            '  <div class="dnp-brud-note"><span class="dnp-brud-tag">ИНФОРМАЦИЯ</span><span>Более подробно о каждом пункте можете узнать в <a href="https://docs.google.com/document/d/1E0ettcqE--eQjUvUlX4ZIv9UmGBjjXD7QLfmqlYDgAE/edit?tab=t.3eryletig9pf" target="_blank" class="dnp-brud-link"><strong>БРУД</strong></a>.</span></div>',
            '</div>'
          ].join('');
          main.insertBefore(newSec, document.querySelector('[data-screen-panel="forms-gui"]') || null);
        }
      }
    });
  }

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

  loadUstavSections();
  loadDynamicUstav();
  setInterval(function() {
    loadUstavSections();
    loadDynamicUstav();
  }, 25000);
})();