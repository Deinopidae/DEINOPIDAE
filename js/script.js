(function () {
  var app = window.DnpApp = window.DnpApp || {};
  app.state = app.state || { employeeDb: {}, activeScreen: "ustav-01" };
  var API_BASE = window.DnpApi.baseUrl;

  var loader = document.getElementById("dnp-loader");
  var loaderBar = document.getElementById("loader-bar");
  var loaderPercent = document.getElementById("loader-percent");
  var loaderPin = document.getElementById("loader-pin");
  var loaderBg = document.getElementById("loader-bg");
  var loaderWipe = document.getElementById("loader-wipe");
  var loaderContent = document.getElementById("loader-content");

  if (loader && loaderBar && loaderPercent && loaderPin && loaderBg && loaderWipe) {
    var currentProgress = 0;
    var targetProgress = 15;
    var fullyLoaded = false;
    var isFinished = false;

    function markDomReady() {
      targetProgress = Math.max(targetProgress, 40);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", markDomReady, { once: true });
    } else {
      markDomReady();
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() {
        targetProgress = Math.max(targetProgress, 60);
      });
    }

    var assets = Array.from(document.images || []).concat(Array.from(document.querySelectorAll("iframe")));
    var loadedAssets = 0;

    function markAssetReady() {
      loadedAssets++;
      if (assets.length) {
        targetProgress = Math.max(targetProgress, Math.round(60 + loadedAssets / assets.length * 30));
      }
    }

    if (assets.length) {
      assets.forEach(function(asset) {
        if (asset.complete || asset.readyState === "complete") {
          markAssetReady();
        } else {
          asset.addEventListener("load", markAssetReady, { once: true });
          asset.addEventListener("error", markAssetReady, { once: true });
        }
      });
    } else {
      targetProgress = Math.max(targetProgress, 85);
    }

    function markPageLoaded() {
      targetProgress = 100;
      fullyLoaded = true;
    }

    if (document.readyState === "complete") {
      markPageLoaded();
    } else {
      window.addEventListener("load", markPageLoaded, { once: true });
    }

    window.setTimeout(function() {
      targetProgress = 100;
      fullyLoaded = true;
    }, 6000);

    function completeLoadingSequence() {
      loaderPercent.textContent = "100";
      loaderBar.style.height = "100%";
      loaderBg.style.filter = "blur(0px)";

      window.setTimeout(function() {
        loaderWipe.classList.add("wipe-in");
        window.setTimeout(function() {
          loaderContent.style.opacity = "0";
          loaderBg.style.opacity = "0";
          loaderWipe.classList.remove("wipe-in");
          loaderWipe.classList.add("wipe-out");
          window.setTimeout(function() {
            loader.style.opacity = "0";
            loader.style.pointerEvents = "none";
            window.setTimeout(function() {
              loader.style.display = "none";
            }, 300);
          }, 480);
        }, 500);
      }, 250);
    }

    function renderLoader() {
      if (currentProgress < targetProgress) {
        currentProgress += Math.max(0.35, (targetProgress - currentProgress) * 0.12);
        currentProgress = Math.min(currentProgress, 100);
      }

      loaderPercent.textContent = Math.floor(currentProgress);
      loaderBar.style.height = currentProgress + "%";
      var trackHeight = loader.clientHeight || window.innerHeight;
      var currentY = trackHeight * currentProgress / 100;
      loaderPin.style.top = Math.min(Math.max(currentY, 28), trackHeight - 48) + "px";
      loaderBg.style.filter = "blur(" + (20 * (1 - currentProgress / 100)).toFixed(1) + "px)";

      if (currentProgress >= 100 && fullyLoaded) {
        if (!isFinished) {
          isFinished = true;
          completeLoadingSequence();
        }
        return;
      }

      requestAnimationFrame(renderLoader);
    }

    requestAnimationFrame(renderLoader);
  }

  var adminTicketTab = 'active';
  var allAdminTickets = [];

  function isArchivedTicket(ticket) {
    var status = String(ticket.status || "").toUpperCase();
    return ["APPROVED", "REJECTED", "DELETED", "ОДОБРЕНО", "ОТКЛОНЕНО", "УДАЛЕНО"].indexOf(status) !== -1;
  }

  function isActiveTicket(ticket) {
    var status = String(ticket.status || "").toUpperCase();
    return ["PENDING", "IN PROGRESS", "НА ПРОВЕРКЕ", "В РАБОТЕ"].indexOf(status) !== -1;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function safeExternalUrl(value) {
    try {
      var url = new URL(String(value || ""), window.location.href);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  app.switchAdminTicketTab = function(tab) {
    adminTicketTab = tab;
    var bAct = document.getElementById("btn-tickets-active");
    var bArc = document.getElementById("btn-tickets-archive");
    if (bAct && bArc) {
      bAct.classList.toggle("is-active", tab === 'active');
      bArc.classList.toggle("is-active", tab === 'archive');
    }
    renderAdminTicketsList();
  };

  function renderAdminTicketsList() {
    var cont = document.getElementById("adm-tickets-list");
    if (!cont) return;

    var activeList = allAdminTickets.filter(isActiveTicket);
    var archiveList = allAdminTickets.filter(isArchivedTicket);

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
      var status = String(t.status || "").toUpperCase();
      var isClosed = isArchivedTicket(t);
      var stClass = 'st-pending';
      if (status === 'В РАБОТЕ' || status === 'IN PROGRESS') stClass = 'st-work';
      if (status === 'ОДОБРЕНО' || status === 'APPROVED') stClass = 'st-ok';
      if (status === 'ОТКЛОНЕНО' || status === 'REJECTED') stClass = 'st-reject';

      var actionsHtml = '';
      if (isClosed) {
        actionsHtml = [
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">',
          '  <div class="dnp-ticket-verdict-box" style="flex:1; margin-right:12px;">',
          '    <span style="color:var(--line);">Решение (' + escapeHtml(t.officer || 'Офицер') + '):</span> <b style="color:#fff;">' + escapeHtml(t.officerComment || 'Без комментария') + '</b>',
          '  </div>',
          '  <button type="button" class="dnp-action is-danger" data-action="deleteAdminTicket" data-report-id="' + escapeHtml(t.reportId) + '" style="margin:0;">УДАЛИТЬ</button>',
          '</div>'
        ].join('');
      } else {
        actionsHtml = [
          '<div style="display:flex; gap:8px; margin-top:8px; align-items:center; flex-wrap:wrap;">',
          '  <input type="text" id="adm-comment-' + escapeHtml(t.reportId) + '" placeholder="Комментарий / вердикт офицера" value="' + escapeHtml(t.officerComment || '') + '" class="dnp-admin-input" style="flex:1; min-width:200px;">',
          '  <button type="button" class="dnp-action" data-action="respondAdminTicket" data-report-id="' + escapeHtml(t.reportId) + '" data-status="ОДОБРЕНО" style="margin:0; border-color:var(--ok); color:var(--ok);">ОДОБРИТЬ</button>',
          '  <button type="button" class="dnp-action is-danger" data-action="respondAdminTicket" data-report-id="' + escapeHtml(t.reportId) + '" data-status="ОТКЛОНЕНО" style="margin:0;">ОТКЛОНИТЬ</button>',
          '  <button type="button" class="dnp-action is-secondary" data-action="deleteAdminTicket" data-report-id="' + escapeHtml(t.reportId) + '" style="margin:0;">УДАЛИТЬ</button>',
          '</div>'
        ].join('');
      }

      return [
        '<div style="background:var(--panel-2); border:1px solid var(--line-soft); padding:12px; display:flex; flex-direction:column; gap:6px;">',
        '  <div style="display:flex; justify-content:space-between; align-items:center;">',
        '    <div>',
        '      <b style="color:#fff; font-size:13px;">' + escapeHtml(t.type) + ' <span style="color:var(--muted); font-size:11px;">(#' + escapeHtml(t.reportId) + ')</span></b>',
        '      <span style="color:var(--line); font-size:11.5px; margin-left:8px;">' + escapeHtml(t.username) + ' (' + escapeHtml(t.roblox) + ')</span>',
        '    </div>',
        '    <span class="dnp-badge ' + stClass + '">' + escapeHtml(t.status) + '</span>',
        '  </div>',
        '  <div style="font-size:12.5px; color:var(--text); line-height:1.5;">' + escapeHtml(t.description) + '</div>',
        t.links && t.links !== 'Отсутствуют' && safeExternalUrl(t.links) ? '<div style="font-size:11.5px;"><a href="' + escapeHtml(safeExternalUrl(t.links)) + '" target="_blank" rel="noopener noreferrer" class="dnp-brud-link">Материалы</a></div>' : '',
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
  var activeScreenBeforeRouting = "ustav-01";
  var screenTransitionStates = new WeakMap();

  function clearScreenTransition(content) {
    var previous = screenTransitionStates.get(content);
    if (previous) {
      window.clearTimeout(previous.timeout);
      content.removeEventListener("animationend", previous.onAnimationEnd);
      screenTransitionStates.delete(content);
    }
    content.classList.remove("dnp-flicker-1", "dnp-flicker-2", "dnp-flicker-3", "dnp-no-flicker");
    content.style.removeProperty("animation-duration");
    content.style.removeProperty("animation-iteration-count");
  }

  function playScreenTransition(panel) {
    var content = panel.querySelector(".dnp-screen-content");
    if (!content) return;

    clearScreenTransition(content);
    var shouldFlicker = Math.random() < 0.68;
    var duration = 0.15;
    var iterations = 1;
    if (!shouldFlicker) {
      content.classList.add("dnp-no-flicker");
    } else {
      var flickerVariant = 1 + Math.floor(Math.random() * 3);
      duration = 0.24 + Math.random() * 0.56;
      iterations = 1 + Math.floor(Math.random() * 3);
      content.style.animationDuration = duration.toFixed(2) + "s";
      content.style.animationIterationCount = String(iterations);
      content.classList.add("dnp-flicker-" + flickerVariant);
    }

    var onAnimationEnd = function(event) {
      if (event.target === content) clearScreenTransition(content);
    };
    var timeout = window.setTimeout(clearScreenTransition.bind(null, content), duration * iterations * 1000 + 100);
    screenTransitionStates.set(content, { onAnimationEnd: onAnimationEnd, timeout: timeout });
    content.addEventListener("animationend", onAnimationEnd);
  }

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
    panel.setAttribute("aria-labelledby", panelName === "profile" ? "dnp-profile-name" : "tab-" + panelName);
  });

  app.openScreen = function(name) {
    var targetPanel = Array.from(root.querySelectorAll("[data-screen-panel]")).find(function(panel) {
      return panel.getAttribute("data-screen-panel") === name;
    });
    if (!targetPanel) return;
    var isScreenChange = name !== activeScreenBeforeRouting;
    if (isScreenChange) playScreenTransition(targetPanel);
    activeScreenBeforeRouting = name;
    app.state.activeScreen = name;
    var layoutElement = document.getElementById("dnp-layout");
    if (layoutElement) {
      layoutElement.classList.remove("is-nav-open");
      var navToggle = document.querySelector(".dnp-nav-toggle");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    }

    if (layout) {
      if (name === "database") {
        layout.classList.add("is-terminal-mode");
      } else {
        layout.classList.remove("is-terminal-mode");
      }
    }

    root.querySelectorAll("[data-screen-panel]").forEach(function(panel) {
      var isActive = panel === targetPanel;
      panel.classList.toggle("is-visible", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
    root.querySelectorAll("[data-screen]").forEach(function(button) {
      var isActive = button.getAttribute("data-screen") === name;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (name === "database") initTerminalBoot();
    else if (name === "tickets") app.loadMyTickets();
    else if (name === "notifications") app.loadNotifications();
    else if (name === "admin-panel") app.loadAdminTickets();
    else if (name === "profile") app.loadProfile();
    if (isEditorModeActive && name.indexOf("ustav-") === 0) {
      var firstModule = targetPanel.querySelector(".dnp-module");
      if (firstModule) selectEditedElement(firstModule);
    }
  };

  app.loadProfile = async function() {
    var fields = document.getElementById("dnp-profile-fields");
    var name = document.getElementById("dnp-profile-name");
    var nick = document.getElementById("dnp-profile-nick");
    var avatar = document.getElementById("dnp-profile-avatar");
    var online = document.getElementById("dnp-profile-online");
    if (!fields || !name || !nick || !avatar || !online) return;

    var token = localStorage.getItem("dnp_auth_token");
    if (!token) {
      fields.replaceChildren();
      name.textContent = "НЕ АВТОРИЗОВАН";
      nick.textContent = "Войдите в личный кабинет";
      avatar.textContent = "—";
      online.textContent = "НЕТ СЕССИИ";
      return;
    }

    name.textContent = "ЗАГРУЗКА";
    nick.textContent = "СИНХРОНИЗАЦИЯ ЛИЧНОГО ДЕЛА";
    fields.replaceChildren();

    try {
      var profile = await window.DnpApi.requestJson("/api/user/profile");
      var account = profile && profile.account ? profile.account : {};
      var staff = profile && profile.staff ? profile.staff : {};
      name.textContent = account.displayName || account.username || "СОТРУДНИК";
      nick.textContent = account.roblox || "Ник Roblox не указан";
      avatar.replaceChildren();
      if (typeof account.avatar === "string" && /^https:\/\//i.test(account.avatar)) {
        var image = document.createElement("img");
        image.src = account.avatar;
        image.alt = "";
        image.referrerPolicy = "no-referrer";
        avatar.appendChild(image);
      } else {
        avatar.textContent = String(name.textContent).charAt(0).toUpperCase();
      }
      online.textContent = account.online ? "В СЕТИ" : "НЕ В СЕТИ";
      online.classList.toggle("is-offline", !account.online);

      var values = [
        ["Статус сотрудника", account.activityStatus],
        ["Звание", staff.title],
        ["Ранг", staff.rank],
        ["МП", staff.mp],
        ["Часы", staff.hours],
        ["Оборудование", staff.equipment],
        ["Хихикойны", staff.coins],
        ["Статус нормы", staff.quota_status],
        ["Активность", staff.activity],
        ["Уровень активности", staff.activity_level],
        ["Отпуск", staff.vacation],
        ["Наказания", staff.penalties],
        ["Повышение", staff.promotion],
        ["Лекция ПО", staff.lectures && staff.lectures.po],
        ["Лекция СО", staff.lectures && staff.lectures.so],
        ["Лекция МП", staff.lectures && staff.lectures.mp],
        ["Проверка C", staff.exams && staff.exams.c],
        ["Проверка B", staff.exams && staff.exams.b],
        ["Проверка A", staff.exams && staff.exams.a]
      ];

      values.forEach(function(entry) {
        var field = document.createElement("div");
        field.className = "dnp-profile-field";
        var label = document.createElement("dt");
        var value = document.createElement("dd");
        label.textContent = entry[0];
        value.textContent = entry[1] == null || entry[1] === "" ? "—" : String(entry[1]);
        field.append(label, value);
        fields.appendChild(field);
      });
    } catch (error) {
      name.textContent = "НЕТ ДАННЫХ";
      nick.textContent = "Не удалось загрузить профиль";
      avatar.textContent = "!";
      online.textContent = "ОШИБКА СИНХРОНИЗАЦИИ";
      online.classList.add("is-offline");
      console.error("Не удалось загрузить профиль сотрудника:", error.message);
    }
  };

  root.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-screen]");
    if (trigger && !trigger.disabled) {
      var screenName = trigger.getAttribute("data-screen");
      app.openScreen(screenName);
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
    app.openScreen(firstButton.getAttribute("data-screen"));
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

  app.state.employeeDb = {
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

    var db = app.state.employeeDb || {};
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
      var p = app.state.employeeDb[nick];
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
        printLine("Ведомость: <a class='dnp-term-link' href='" + sheetsUrl + "' target='_blank' rel='noopener noreferrer'>ОТКРЫТЬ ТАБЛИЦУ DEINOPIDAE</a>");
      }
      return;
    }

    if (first === "FIND") {
      var query = parts.slice(1).join(" ").replace(/^"|"$/g, "");
      executeFind(query);
      return;
    }

    if (first === "FORMS") {
      app.openScreen("forms-gui");
      printLine("[SYS] Открыта вкладка обращений.");
      return;
    }

    if (first === "HELP") {
      printLine("HELP                  - Вызов списка доступных команд");
      printLine("FIND <фраза>          - Глобальный поиск по уставу и сотрудникам");
      printLine("STAFF <ник>           - Личное дело сотрудника");
      printLine("FORMS                 - Открыть вкладку обращений");
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

  app.clearGuiForm = function() {
    var desc = document.getElementById("gui-form-desc");
    var links = document.getElementById("gui-form-links");
    var target = document.getElementById("gui-form-target");
    var rules = document.getElementById("gui-form-rules");
    var msg = document.getElementById("gui-form-status-msg");
    var files = document.getElementById("gui-form-files");
    var filesList = document.getElementById("gui-form-files-list");
    if (desc) desc.value = "";
    if (links) links.value = "";
    if (target) target.value = "";
    if (rules) rules.value = "";
    if (files) files.value = "";
    if (filesList) filesList.textContent = "";
    if (msg) msg.textContent = "";
  };

  async function encodeFormAttachment(file) {
    var bytes = new Uint8Array(await file.arrayBuffer());
    var binary = "";
    for (var offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 0x8000));
    }
    return {
      name: file.name,
      contentType: file.type || "application/octet-stream",
      data: btoa(binary)
    };
  }

  var formFilesInput = document.getElementById("gui-form-files");
  if (formFilesInput) {
    formFilesInput.addEventListener("change", function() {
      var selectedFiles = Array.from(formFilesInput.files || []);
      var totalSize = selectedFiles.reduce(function(sum, file) { return sum + file.size; }, 0);
      var filesList = document.getElementById("gui-form-files-list");
      if (selectedFiles.length > 10 || totalSize > 20 * 1024 * 1024) {
        formFilesInput.value = "";
        if (filesList) filesList.textContent = "Выберите не более 10 файлов общим размером до 20 МБ.";
        return;
      }
      if (filesList) {
        filesList.textContent = selectedFiles.length
          ? selectedFiles.map(function(file) { return file.name + " (" + Math.ceil(file.size / 1024) + " КБ)"; }).join(" | ")
          : "";
      }
    });
  }

  app.submitFormFromGui = async function() {
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
    var filesInput = document.getElementById("gui-form-files");
    var selectedFiles = Array.from(filesInput && filesInput.files || []);
    var totalSize = selectedFiles.reduce(function(sum, file) { return sum + file.size; }, 0);

    if (!desc) {
      statusMsg.style.color = "var(--danger)";
      statusMsg.textContent = "[ОШИБКА] Заполните описание обращения.";
      return;
    }
    if (selectedFiles.length > 10 || totalSize > 20 * 1024 * 1024) {
      statusMsg.style.color = "var(--danger)";
      statusMsg.textContent = "[ОШИБКА] Допускается до 10 файлов общим размером не более 20 МБ.";
      return;
    }

    statusMsg.style.color = "var(--line)";
    statusMsg.textContent = "[SYS] Передача рапорта в базу...";

    try {
      var files = await Promise.all(selectedFiles.map(encodeFormAttachment));
      var res = await window.DnpApi.request(API_BASE + "/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          type: category,
          description: desc,
          links: links || "Отсутствуют",
          targetUser: targetUser,
          rulesPoints: rulesPoints,
          files: files
        })
      });

      var data = await res.json();
      if (res.ok && data.success) {
        app.clearGuiForm();
        statusMsg.style.color = "var(--ok)";
        statusMsg.textContent = "[УСПЕХ] Обращение #" + data.reportId + " зарегистрировано!";
      } else {
        statusMsg.style.color = "var(--danger)";
        statusMsg.textContent = "[ОТКАЗ] " + (data.error || "Не удалось отправить");
      }
    } catch (e) {
      statusMsg.style.color = "var(--danger)";
      statusMsg.textContent = "[СБОЙ СЕТИ] Ошибка соединения с сервером.";
      if (app.setNetStatus) app.setNetStatus(false, "CONN_LOST");
    }
  };

  var submitBtn = document.getElementById("gui-form-submit-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", app.submitFormFromGui);
  }

  app.loadMyTickets = async function() {
    var cont = document.getElementById("tickets-list-container");
    if (!cont) return;

    var token = localStorage.getItem("dnp_auth_token");
    if (!token) {
      cont.innerHTML = '<div style="color:var(--muted); font-size:12.5px;">Авторизуйтесь для просмотра ваших обращений.</div>';
      return;
    }

    cont.innerHTML = '<div style="color:var(--line); font-size:12.5px;">Загрузка реестра обращений...</div>';

    try {
      var res = await window.DnpApi.request(API_BASE + "/api/forms/my", {
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
          '<div class="dnp-ticket-card" data-action="toggleTicket" role="button" tabindex="0">',
          '  <div class="dnp-ticket-header">',
          '    <div>',
          '      <b>' + escapeHtml(t.type) + ' <span style="color:var(--muted); font-size:11px;">(#' + escapeHtml(t.reportId) + ')</span></b>',
          '      <span style="color:var(--muted); font-size:11px; margin-left:8px;">' + escapeHtml(dateSubmit) + '</span>',
          '    </div>',
          '    <span class="dnp-badge ' + stClass + '">' + escapeHtml(t.status || "НА ПРОВЕРКЕ") + '</span>',
          '  </div>',
          '  <div class="dnp-ticket-history">',
          '    <div><span style="color:var(--line);">Суть:</span> ' + escapeHtml(t.description) + '</div>',
          t.links && t.links !== "Отсутствуют" && safeExternalUrl(t.links) ? '    <div><span style="color:var(--line);">Материалы:</span> <a href="' + escapeHtml(safeExternalUrl(t.links)) + '" target="_blank" rel="noopener noreferrer" class="dnp-brud-link">Открыть вложение</a></div>' : '',
          t.officer ? '    <div style="margin-top:4px; padding-top:6px; border-top:1px dashed var(--line-soft);"><span style="color:var(--line);">Офицер:</span> ' + escapeHtml(t.officer) + ' (' + escapeHtml(dateUpdate) + ')</div>' : '',
          t.officerComment ? '    <div class="dnp-ticket-verdict-box"><span style="color:var(--line);">Вердикт офицера:</span> <b style="color:#fff;">' + escapeHtml(t.officerComment) + '</b></div>' : '',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:12.5px;">Сбой при загрузке обращений.</div>';
    }
  };

  app.deleteNotification = async function(e, id) {
    e.stopPropagation();
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;
    try {
      await window.DnpApi.request(API_BASE + "/api/notifications/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      app.loadNotifications();
    } catch (err) {}
  };

  app.clearAllNotifications = async function() {
    if (!confirm("Удалить все уведомления?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;
    try {
      await window.DnpApi.request(API_BASE + "/api/notifications", {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      app.loadNotifications();
    } catch (err) {}
  };

  app.loadNotifications = async function() {
    var cont = document.getElementById("notifications-list-container");
    var token = localStorage.getItem("dnp_auth_token");
    if (!token || !cont) return;

    try {
      var res = await window.DnpApi.request(API_BASE + "/api/notifications/my", {
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
          '<div class="dnp-notif-box ' + unreadClass + '" data-action="markNotificationRead" data-id="' + escapeHtml(n._id) + '">',
          '  <div class="dnp-notif-top">',
          '    <b>' + escapeHtml(n.title) + '</b>',
          '    <div style="display:flex; align-items:center; gap:8px;">',
          '      <span class="dnp-notif-time">' + escapeHtml(dateStr) + '</span>',
          '      <button type="button" class="dnp-notif-del-btn" data-action="deleteNotification" data-id="' + escapeHtml(n._id) + '" aria-label="Удалить уведомление">УДАЛИТЬ</button>',
          '    </div>',
          '  </div>',
          '  <div class="dnp-notif-msg">' + escapeHtml(n.message) + '</div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      if (cont) cont.innerHTML = '<div style="color:var(--danger); font-size:12.5px;">Ошибка загрузки уведомлений.</div>';
    }
  };

  app.markNotificationRead = async function(id) {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;
    try {
      await window.DnpApi.request(API_BASE + "/api/notifications/read/" + id, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      app.loadNotifications();
    } catch (e) {}
  };

  app.markAllNotificationsRead = async function() {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;
    try {
      await window.DnpApi.request(API_BASE + "/api/notifications/read-all", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      app.loadNotifications();
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
      var res = await window.DnpApi.request(API_BASE + "/api/admin/check", {
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

  document.querySelectorAll(".dnp-admin-tab-btn[data-admin-tab]").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".dnp-admin-tab-btn[data-admin-tab]").forEach(function(b) { b.classList.remove("is-active"); });
      document.querySelectorAll(".dnp-admin-panel-view").forEach(function(v) { v.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var tab = btn.getAttribute("data-admin-tab");
      var view = document.getElementById("adm-view-" + tab);
      if (view) view.classList.add("is-active");

      if (tab === "tickets") app.loadAdminTickets();
      if (tab === "ustav") app.loadAdminUstav();
      if (tab === "users") app.loadAdminUsers();
      if (tab === "officers") app.loadAdminOfficers();
    });
  });

  app.loadAdminTickets = async function() {
    var cont = document.getElementById("adm-tickets-list");
    var token = localStorage.getItem("dnp_auth_token");
    if (!cont || !token) return;

    cont.innerHTML = '<div style="color:var(--muted); font-size:12px;">Загрузка тикетов...</div>';
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/tickets", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var list = await res.json();
      allAdminTickets = Array.isArray(list) ? list : [];
      renderAdminTicketsList();
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:12px;">Ошибка загрузки тикетов.</div>';
    }
  };

  app.respondAdminTicket = async function(reportId, status) {
    var token = localStorage.getItem("dnp_auth_token");
    var commentInput = document.getElementById("adm-comment-" + reportId);
    var comment = commentInput ? commentInput.value.trim() : "";
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/tickets/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ reportId: reportId, status: status, officerComment: comment })
      });
      var data = await res.json().catch(function() { return {}; });
      if (res.ok && data.success) {
        app.loadAdminTickets();
      } else {
        alert("Ошибка: " + (data.error || "Не удалось изменить статус"));
      }
    } catch (e) {}
  };

  app.deleteAdminTicket = async function(reportId) {
    if (!confirm("Удалить обращение #" + reportId + "? В Discord статус изменится на УДАЛЕНО.")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await window.DnpApi.request(API_BASE + "/api/admin/tickets/" + reportId, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      app.loadAdminTickets();
    } catch (e) {}
  };

  app.loadAdminUsers = async function() {
    var tbody = document.querySelector("#adm-users-table tbody");
    var token = localStorage.getItem("dnp_auth_token");
    if (!tbody || !token) return;
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/users", {
        headers: { "Authorization": "Bearer " + token }
      });
      var users = await res.json();
      tbody.innerHTML = users.map(function(u) {
        var onlineClass = u.isOnline ? 'st-ok' : 'st-deleted';
        var onlineLabel = u.isOnline ? 'В СЕТИ' : 'НЕ В СЕТИ';
        return [
          '<tr>',
          '  <td><b>' + escapeHtml(u.displayName || u.username) + '</b></td>',
          '  <td>' + escapeHtml(u.roblox) + '</td>',
          '  <td><span class="dnp-badge ' + onlineClass + '">' + onlineLabel + '</span></td>',
          '  <td>' + new Date(u.registeredAt).toLocaleDateString() + '</td>',
          '  <td><button type="button" class="dnp-action is-danger" data-action="deleteAdminUser" data-id="' + escapeHtml(u._id) + '" style="margin:0; padding:4px 8px; font-size:10.5px;">УДАЛИТЬ</button></td>',
          '</tr>'
        ].join('');
      }).join('');
    } catch (e) {}
  };

  app.deleteAdminUser = async function(id) {
    if (!confirm("Удалить аккаунт пользователя?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await window.DnpApi.request(API_BASE + "/api/admin/users/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      app.loadAdminUsers();
    } catch (e) {}
  };

  app.loadAdminOfficers = async function() {
    var cont = document.getElementById("adm-officers-list");
    var token = localStorage.getItem("dnp_auth_token");
    if (!cont || !token) return;
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/officers", {
        headers: { "Authorization": "Bearer " + token }
      });
      var list = await res.json();
      cont.innerHTML = list.map(function(o) {
        var onlineStatus = o.isOnline
          ? '<span class="dnp-officer-online">В сети</span>'
          : '<span class="dnp-officer-online is-offline">Не в сети</span>';
        return [
          '<div style="background:var(--panel-2); border:1px solid var(--line-soft); padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">',
          '  <div><b style="color:#fff;">' + escapeHtml(o.roblox) + '</b><span style="font-size:11px; color:var(--muted); margin:0 10px;">(Назначил: ' + escapeHtml(o.addedBy) + ')</span>' + onlineStatus + '</div>',
          '  <button type="button" class="dnp-action is-danger" data-action="removeAdminOfficer" data-nick="' + escapeHtml(o.roblox) + '" style="margin:0; padding:3px 8px; font-size:10.5px;">СНЯТЬ</button>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {}
  };

  app.addAdminOfficer = async function() {
    var input = document.getElementById("adm-new-officer-roblox");
    var nick = input ? input.value.trim() : "";
    if (!nick) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/officers/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ roblox: nick })
      });
      var data = await res.json();
      if (res.ok) {
        input.value = "";
        app.loadAdminOfficers();
      } else {
        alert(data.error || "Ошибка");
      }
    } catch (e) {}
  };

  app.removeAdminOfficer = async function(nick) {
    if (!confirm("Снять статус офицера с " + nick + "?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await window.DnpApi.request(API_BASE + "/api/admin/officers/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ roblox: nick })
      });
      app.loadAdminOfficers();
    } catch (e) {}
  };

  app.loadAdminUstav = async function() {
    var cont = document.getElementById("adm-ustav-list");
    if (!cont) return;
    cont.innerHTML = '<div style="color:var(--muted); font-size:12px;">Загрузка статей устава...</div>';
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/ustav");
      var list = await res.json();
      if (!list || list.length === 0) {
        cont.innerHTML = '<div style="color:var(--muted); font-size:12px;">Дополнительных статей пока нет.</div>';
        return;
      }
      cont.innerHTML = list.map(function(item) {
        var borderColor = /^#[0-9a-f]{3,8}$/i.test(item.borderColor || "") ? item.borderColor : "var(--line-soft)";
        var textColor = /^#[0-9a-f]{3,8}$/i.test(item.textColor || "") ? item.textColor : "var(--text)";
        var bgColor = /^#[0-9a-f]{3,8}$/i.test(item.highlightColor || "") ? item.highlightColor : "var(--panel-2)";
        return [
          '<div style="background:' + bgColor + '; border:1px solid var(--line-soft); border-left:3px solid ' + borderColor + '; padding:10px 14px; display:flex; justify-content:space-between; align-items:flex-start;">',
          '  <div>',
          '    <b style="color:#fff;">' + escapeHtml(item.num) + ' ' + escapeHtml(item.title) + '</b> <span style="font-size:10.5px; color:var(--line); margin-left:6px;">[' + escapeHtml(item.sectionId) + ' | ' + escapeHtml(item.tag) + ']</span>',
          '    <div style="font-size:12px; color:' + textColor + '; margin-top:4px; line-height:1.5;">' + escapeHtml(item.text) + '</div>',
          '  </div>',
          '  <div style="display:flex; gap:6px; margin-left:12px; flex-shrink:0;">',
          '    <button type="button" class="dnp-action is-danger" data-action="deleteAdminUstav" data-id="' + escapeHtml(item._id) + '" style="margin:0; padding:4px 8px; font-size:10.5px;">УДАЛИТЬ</button>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:12px;">Ошибка сети.</div>';
    }
  };

  app.deleteAdminUstav = async function(id) {
    if (!confirm("Удалить этот пункт устава?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await window.DnpApi.request(API_BASE + "/api/admin/ustav/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      app.loadAdminUstav();
      loadDynamicUstav();
    } catch (e) {}
  };

  var isEditorModeActive = false;
  var currentEditedElement = null;
  var _ustavSnapshot = {};
  var undoStack = [];

  function stripContenteditable(container) {
    container.querySelectorAll("[contenteditable]").forEach(function(el) {
      el.removeAttribute("contenteditable");
    });
  }

  function sanitizeUstavHtml(html) {
    var template = document.createElement("template");
    template.innerHTML = String(html || "");
    var allowedTags = new Set([
      "A", "ARTICLE", "B", "BLOCKQUOTE", "BR", "DIV", "EM", "H1", "H2", "H3", "HR", "I",
      "IMG", "LI", "OL", "P", "SPAN", "STRONG", "TABLE", "TBODY", "TD", "TH", "THEAD",
      "TR", "U", "UL"
    ]);
    var removedTags = new Set(["IFRAME", "OBJECT", "SCRIPT", "STYLE", "SVG", "MATH", "VIDEO", "AUDIO", "EMBED", "FORM"]);
    var allowedAttributes = new Set(["alt", "class", "colspan", "height", "href", "id", "rel", "rowspan", "src", "style", "target", "title", "width"]);
    var allowedStyles = new Set([
      "background-color", "border", "border-left", "border-left-color", "box-shadow", "color",
      "display", "font-family", "font-size", "font-weight", "gap", "line-height", "margin",
      "margin-bottom", "padding", "text-align", "text-decoration"
    ]);

    function sanitizeChildren(parent) {
      Array.from(parent.childNodes).forEach(function(node) {
        if (node.nodeType === Node.COMMENT_NODE) {
          node.remove();
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (removedTags.has(node.tagName)) {
          node.remove();
          return;
        }
        if (!allowedTags.has(node.tagName)) {
          sanitizeChildren(node);
          node.replaceWith.apply(node, Array.from(node.childNodes));
          return;
        }

        Array.from(node.attributes).forEach(function(attribute) {
          var name = attribute.name.toLowerCase();
          if (!allowedAttributes.has(name)) {
            node.removeAttribute(attribute.name);
            return;
          }
          if (name === "href" || name === "src") {
            var value = attribute.value.trim();
            if (/^(?:javascript|data|vbscript):/i.test(value) || value.indexOf("//") === 0) {
              node.removeAttribute(attribute.name);
              return;
            }
            try {
              var url = new URL(value, window.location.href);
              var protocols = name === "href" ? ["http:", "https:", "mailto:"] : ["http:", "https:"];
              if (protocols.indexOf(url.protocol) === -1) node.removeAttribute(attribute.name);
            } catch (error) {
              node.removeAttribute(attribute.name);
            }
          } else if (name === "style") {
            var safeStyle = [];
            Array.from(node.style).forEach(function(property) {
              var value = node.style.getPropertyValue(property).trim();
              if (allowedStyles.has(property) && !/(?:url\s*\(|expression\s*\(|javascript:|vbscript:|@import|behavior\s*:)/i.test(value)) {
                safeStyle.push(property + ": " + value);
              }
            });
            if (safeStyle.length) node.setAttribute("style", safeStyle.join("; "));
            else node.removeAttribute("style");
          }
        });
        if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
          node.setAttribute("rel", "noopener noreferrer");
        }
        sanitizeChildren(node);
      });
    }

    sanitizeChildren(template.content);
    return template.innerHTML;
  }

  function stripTemporaryUstavSelection(container) {
    if (container.matches && container.matches(".is-focused-module")) {
      container.classList.remove("is-focused-module");
    }
    container.querySelectorAll(".is-focused-module").forEach(function(el) {
      el.classList.remove("is-focused-module");
    });
    container.querySelectorAll("[style]").forEach(function(el) {
      el.style.removeProperty("outline");
      var style = el.getAttribute("style");
      if (!style || !style.trim()) el.removeAttribute("style");
    });
  }

  stripContenteditable(document);

  function getActiveModule() {
    if (currentEditedElement) {
      var parentModule = currentEditedElement.matches && currentEditedElement.matches(".dnp-module")
        ? currentEditedElement
        : currentEditedElement.closest && currentEditedElement.closest(".dnp-module");
      if (parentModule && parentModule.closest('[data-screen-panel^="ustav-"].is-visible')) return parentModule;
    }
    var visiblePanel = document.querySelector('.dnp-screen.is-visible[data-screen-panel^="ustav-"] .dnp-screen-content');
    return visiblePanel ? visiblePanel.querySelector(".dnp-module") : null;
  }

  function selectEditedElement(element) {
    var module = element.closest(".dnp-module");
    var selected = element.closest("li, ul.dnp-list, .dnp-rank-block, p") || module || element;
    document.querySelectorAll(".dnp-module.is-focused-module").forEach(function(item) {
      item.classList.remove("is-focused-module");
    });
    if (module) module.classList.add("is-focused-module");
    currentEditedElement = selected;
  }

  document.addEventListener("click", function(event) {
    if (!isEditorModeActive) return;
    var target = event.target.closest('[data-screen-panel^="ustav-"] .dnp-screen-content');
    if (!target) return;
    var element = event.target.closest(".dnp-module, .dnp-rank-block, .dnp-list, p, li");
    if (element) selectEditedElement(element);
  });

  document.addEventListener("focusin", function(event) {
    if (!isEditorModeActive || !event.target.closest) return;
    var screenContent = event.target.closest('[data-screen-panel^="ustav-"] .dnp-screen-content');
    if (!screenContent) return;
    var element = event.target.closest("li, ul.dnp-list, .dnp-rank-block, p, .dnp-module");
    if (element) selectEditedElement(element);
  });

  document.addEventListener("keydown", function(event) {
    if (!isEditorModeActive || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
    if (undoStack.length === 0) return;
    event.preventDefault();
    app.undoLastUstavDelete();
  });

  function saveUndoNode(node) {
    undoStack.push({
      type: "node",
      node: node,
      parent: node.parentNode,
      nextSibling: node.nextSibling,
      previousSibling: node.previousSibling
    });
  }

  app.undoLastUstavDelete = async function() {
    var item = undoStack[undoStack.length - 1];
    if (!item) return;
    if (item.type === "node") {
      if (!item.parent || !item.parent.isConnected) return;
      var reference = item.nextSibling && item.nextSibling.parentNode === item.parent
        ? item.nextSibling
        : item.previousSibling && item.previousSibling.parentNode === item.parent
          ? item.previousSibling.nextSibling
          : null;
      item.parent.insertBefore(item.node, reference);
      undoStack.pop();
      if (isEditorModeActive) enableInlineEditing();
      return;
    }

    var token = localStorage.getItem("dnp_auth_token");
    try {
      var createRes = await window.DnpApi.request(API_BASE + "/api/admin/ustav/sections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          sectionId: item.section.sectionId,
          title: item.section.title,
          headTitle: item.section.headTitle,
          order: item.section.order
        })
      });
      if (!createRes.ok) throw new Error("Не удалось восстановить раздел (HTTP " + createRes.status + ").");

      var contentRes = await window.DnpApi.request(API_BASE + "/api/admin/ustav/section-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          sectionId: item.section.sectionId,
          html: item.html,
          actionName: "Restored content for section [" + item.section.sectionId + "]"
        })
      });
      if (!contentRes.ok) throw new Error("Раздел восстановлен, но содержимое не сохранено (HTTP " + contentRes.status + ").");

      var main = document.querySelector("main.dnp-main");
      item.panel.querySelector(".dnp-screen-content").innerHTML = item.html;
      if (main && item.panel) {
        var reference = item.nextSibling && item.nextSibling.parentNode === main
          ? item.nextSibling
          : item.previousSibling && item.previousSibling.parentNode === main
            ? item.previousSibling.nextSibling
            : document.querySelector('[data-screen-panel="forms-gui"]');
        main.insertBefore(item.panel, reference);
      }
      undoStack.pop();
      await loadUstavSections();
      if (isEditorModeActive) enableInlineEditing();
    } catch (error) {
      console.error("Не удалось отменить удаление раздела:", error);
    }
  };

  function takeUstavSnapshot() {
    _ustavSnapshot = {};
    document.querySelectorAll('[data-screen-panel^="ustav-"]').forEach(function(sec) {
      var id = sec.getAttribute("data-screen-panel");
      var content = sec.querySelector(".dnp-screen-content");
      if (content) {
        var snapshot = content.cloneNode(true);
        stripContenteditable(snapshot);
        stripTemporaryUstavSelection(snapshot);
        _ustavSnapshot[id] = sanitizeUstavHtml(snapshot.innerHTML);
      }
    });
  }

  function findUstavContent(sectionId) {
    var panel = Array.from(document.querySelectorAll('[data-screen-panel^="ustav-"]')).find(function(item) {
      return item.getAttribute("data-screen-panel") === sectionId;
    });
    return panel && panel.querySelector(".dnp-screen-content");
  }

  function restoreUstavSnapshot() {
    Object.keys(_ustavSnapshot).forEach(function(id) {
      var sec = findUstavContent(id);
      if (sec && _ustavSnapshot[id]) sec.innerHTML = sanitizeUstavHtml(_ustavSnapshot[id]);
    });
  }

  app.toggleUstavEditorMode = async function(forceState) {
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
        var chk = await window.DnpApi.request(API_BASE + "/api/admin/check", {
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
      undoStack = [];
      isEditorModeActive = true;
      pda.classList.add("dnp-editor-mode");
      brand.innerHTML = '<strong>DEINOPIDAE INDUSTRIES</strong> <span class="dnp-editor-tag">[РЕЖИМ РЕДАКТОРА]</span> <span>Департамент S.E. · Kurodzakura</span>';
      dock.style.display = "flex";
      var firstSection = allUstavSections[0];
      app.openScreen(firstSection ? firstSection.sectionId : "ustav-01");
      enableInlineEditing();
    } else {
      restoreUstavSnapshot();
      undoStack = [];
      currentEditedElement = null;
      document.querySelectorAll('[data-screen-panel^="ustav-"] .dnp-screen-content').forEach(stripTemporaryUstavSelection);
      document.querySelectorAll(".is-focused-module").forEach(function(el) {
        el.classList.remove("is-focused-module");
      });
      app.closeAddSectionModal();
      isEditorModeActive = false;
      pda.classList.remove("dnp-editor-mode");
      brand.innerHTML = '<strong>DEINOPIDAE / ДЕИНОПИДЫ</strong> <span>Департамент S.E. · Kurodzakura</span>';
      dock.style.display = "none";
      disableInlineEditing();
    }
  };

  function enableInlineEditing() {
    if (!isEditorModeActive) return;
    var ustavScreens = document.querySelectorAll('[data-screen-panel^="ustav-"]');
    ustavScreens.forEach(function(screen) {
      var editables = screen.querySelectorAll(".dnp-module-title b, .dnp-module-title span, .dnp-module-title em, .dnp-module p, .dnp-list li, .dnp-rank-info b, .dnp-rank-info span");
      editables.forEach(function(el) {
        el.setAttribute("contenteditable", "true");
      });
    });
  }

  function disableInlineEditing() {
    stripContenteditable(document);
  }

  app.docDeleteCurrentItem = function() {
    if (!currentEditedElement || !currentEditedElement.isConnected) {
      return;
    }
    saveUndoNode(currentEditedElement);
    currentEditedElement.remove();
    currentEditedElement = null;
  };

  // 1. Форматирование текста и вставка списков

  app.docFormat = function(cmd, value) {
    if (cmd === 'insertUnorderedList') {
      app.docInsertItem("list");
      return;
    }
    var tags = { bold: "strong", italic: "em", underline: "u" };
    if (tags[cmd]) wrapCurrentSelection(tags[cmd]);
  };

  function wrapCurrentSelection(tagName, styleProperty, styleValue) {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    var range = selection.getRangeAt(0);
    var anchor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    if (!anchor || !anchor.closest('[contenteditable="true"]')) return;

    var wrapper = document.createElement(tagName);
    if (styleProperty) wrapper.style.setProperty(styleProperty, styleValue);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    selection.removeAllRanges();
    var updatedRange = document.createRange();
    updatedRange.selectNodeContents(wrapper);
    selection.addRange(updatedRange);
  }

  app.docSetFont = function(fontName) {
    wrapCurrentSelection("span", "font-family", fontName);
  };

  app.docApplyTextColor = function(color) {
    var module = getActiveModule();
    if (!module) return;
    module.querySelectorAll("p, li, .dnp-rank-info b, .dnp-rank-info span").forEach(function(el) {
      el.style.color = color;
    });
  };

  app.docApplyTitleColor = function(color) {
    var module = getActiveModule();
    if (!module) return;
    module.querySelectorAll(".dnp-module-title b, .dnp-module-title span").forEach(function(el) {
      el.style.color = color;
    });
  };

  app.docApplyBorderColor = function(color) {
    var module = getActiveModule();
    if (!module) return;
    module.style.borderLeftColor = color;
    module.style.boxShadow = "inset 3px 0 0 " + color;
  };

  app.docApplyBgColor = function(color) {
    var module = getActiveModule();
    if (module) module.style.backgroundColor = color;
  };

  app.docInsertItem = function(type) {
    var activePanel = document.querySelector('.dnp-screen.is-visible[data-screen-panel^="ustav-"] .dnp-screen-content');
    if (!activePanel) return;

    var el = document.createElement("div");
    if (type === "card") {
      var activeModule = getActiveModule();
      if (!activeModule || !activePanel.contains(activeModule)) return;
      el.className = "dnp-rank-block lr";
      el.style.marginBottom = "10px";
      el.innerHTML = '<div class="dnp-rank-info"><b>НОВОЕ ЗВАНИЕ / КАРТОЧКА</b><span>Описание требований и нормативов...</span></div>';
      activeModule.appendChild(el);
    } else if (type === "module") {
      el.className = "dnp-module";
      el.innerHTML = '<div class="dnp-module-title"><span>X.X</span><b>НОВЫЙ ПУНКТ</b><em>ACTIVE</em></div><p>Содержание нового пункта устава...</p>';
      var note = activePanel.querySelector(".dnp-brud-note");
      if (note) activePanel.insertBefore(el, note);
      else activePanel.appendChild(el);
    } else if (type === "list") {
      var listModule = getActiveModule();
      if (!listModule || !activePanel.contains(listModule)) return;
      el = document.createElement("ul");
      el.className = "dnp-list";
      el.innerHTML = '<li>Первый пункт списка...</li><li>Второй пункт списка...</li>';
      listModule.appendChild(el);
    }

    enableInlineEditing();
    if (type !== "list" && type !== "card") selectEditedElement(el);
    else selectEditedElement(el);
  };

  app.moveActiveSection = async function(direction) {
    var subnav = document.querySelector(".dnp-subnav");
    if (!subnav) return;
    var activeBtn = subnav.querySelector("button[data-screen].is-active");
    if (!activeBtn) return;

    var items = Array.from(subnav.children).filter(function(item) {
      return item.matches(".dnp-subnav-item-wrap, button[data-screen]");
    });
    var activeItem = activeBtn.closest(".dnp-subnav-item-wrap") || activeBtn;
    var index = items.indexOf(activeItem);
    if (index === -1) return;

    if (direction === -1 && index > 0) {
      subnav.insertBefore(activeItem, items[index - 1]);
    } else if (direction === 1 && index < items.length - 1) {
      subnav.insertBefore(items[index + 1], activeItem);
    } else {
      return;
    }

    try {
      await saveSectionsOrder();
    } catch (error) {
      console.error("Не удалось сохранить порядок разделов устава:", error);
      alert("Не удалось сохранить порядок разделов. Проверьте соединение и права доступа.");
      await loadUstavSections();
    }
  };

  async function saveSectionsOrder() {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) throw new Error("Требуется авторизация офицера.");

    var buttons = Array.from(document.querySelectorAll(".dnp-subnav button[data-screen]"));
    for (var i = 0; i < buttons.length; i++) {
      var sId = buttons[i].getAttribute("data-screen");
      var section = allUstavSections.find(function(item) { return item.sectionId === sId; });
      var title = section ? section.title : buttons[i].textContent.trim();
      var response = await window.DnpApi.request(API_BASE + "/api/admin/ustav/sections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          sectionId: sId,
          title: title,
          headTitle: section ? section.headTitle : title,
          order: i + 1
        })
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
    }

    allUstavSections.forEach(function(section) {
      var order = buttons.findIndex(function(button) {
        return button.getAttribute("data-screen") === section.sectionId;
      });
      if (order !== -1) section.order = order + 1;
    });
    allUstavSections.sort(function(a, b) { return a.order - b.order; });
  }

  app.saveUstavChanges = async function() {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) {
      alert("Требуется авторизация офицера.");
      return;
    }

    var activePanel = document.querySelector('.dnp-screen.is-visible[data-screen-panel^="ustav-"]');
    if (!activePanel) return;

    var secId = activePanel.getAttribute("data-screen-panel");
    var content = activePanel.querySelector(".dnp-screen-content");
    if (!content) return;
    var payloadContent = content.cloneNode(true);
    stripContenteditable(payloadContent);
    stripTemporaryUstavSelection(payloadContent);
    var contentHtml = payloadContent.innerHTML;
    var section = allUstavSections.find(function(item) { return item.sectionId === secId; });
    var sectionTitle = section ? section.title.replace(/^Раздел\s+\d+\s*[—-]?\s*/i, "") : secId;
    var sectionLabel = "Section " + (section ? section.order : secId) + " — " + sectionTitle + " [" + secId + "]";
    var actionName = describeUstavChange(_ustavSnapshot[secId] || "", contentHtml, sectionLabel, secId);

    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/ustav/section-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ sectionId: secId, html: contentHtml, actionName: actionName })
      });

      if (res.ok) {
        // Обновляем базовый снимок, чтобы выход теперь сохранял этот вид
        takeUstavSnapshot();
        alert("Изменения раздела " + secId + " сохранены в базе!");
        app.loadUstavHistory();
      } else {
        alert("Ошибка при сохранении на сервере.");
      }
    } catch (e) {
      alert("Сбой соединения с сервером.");
    }
  };

  function describeUstavChange(previousHtml, nextHtml, sectionLabel, sectionId) {
    var previous = document.createElement("template");
    var next = document.createElement("template");
    previous.innerHTML = previousHtml;
    next.innerHTML = nextHtml;
    var previousModules = Array.from(previous.content.querySelectorAll(".dnp-module"));
    var nextModules = Array.from(next.content.querySelectorAll(".dnp-module"));
    var action = "";

    for (var i = 0; i < nextModules.length; i++) {
      var oldModule = previousModules[i];
      var newModule = nextModules[i];
      if (!oldModule) continue;
      var clause = (newModule.querySelector(".dnp-module-title span") || {}).textContent;
      clause = clause ? " to clause " + clause.trim() : " in " + sectionId;
      if (newModule.querySelectorAll("ul.dnp-list").length > oldModule.querySelectorAll("ul.dnp-list").length) {
        action = "Added unordered list" + clause;
        break;
      }
      if (newModule.querySelectorAll(".dnp-rank-block").length > oldModule.querySelectorAll(".dnp-rank-block").length) {
        action = "Inserted rank card in " + sectionId;
        break;
      }
    }

    if (!action && nextModules.length < previousModules.length) {
      action = "Deleted block in " + sectionId;
    }
    if (!action) {
      var previousCards = previous.content.querySelectorAll(".dnp-rank-block").length;
      var nextCards = next.content.querySelectorAll(".dnp-rank-block").length;
      if (nextCards > previousCards) action = "Inserted rank card in " + sectionId;
      else if (nextCards < previousCards) action = "Deleted block in " + sectionId;
    }
    if (!action) {
      for (var j = 0; j < Math.min(previousModules.length, nextModules.length); j++) {
        if (previousModules[j].textContent !== nextModules[j].textContent) {
          var editedClause = (nextModules[j].querySelector(".dnp-module-title span") || {}).textContent;
          action = "Updated text " + (editedClause ? "in clause " + editedClause.trim() : "in " + sectionId);
          break;
        }
      }
    }
    if (!action && next.content.querySelectorAll(".dnp-list, .dnp-rank-block, .dnp-module, p").length <
        previous.content.querySelectorAll(".dnp-list, .dnp-rank-block, .dnp-module, p").length) {
      action = "Deleted block in " + sectionId;
    }
    if (!action) action = "Updated content in " + sectionId;
    return sectionLabel + ": " + action;
  }

  function escapeUstavHistoryText(value) {
    return String(value || "").replace(/[&<>"']/g, function(character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  app.loadUstavHistory = async function() {
    var cont = document.getElementById("adm-ustav-history-list");
    var token = localStorage.getItem("dnp_auth_token");
    if (!cont || !token) return;

    cont.innerHTML = '<div style="color:var(--muted); font-size:11.5px;">Загрузка истории ревизий...</div>';
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/ustav/history", {
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
          '    <b style="color:#fff; font-size:12px;">[' + escapeUstavHistoryText(rev.sectionId) + ']</b>',
          '    <span style="color:var(--line); font-size:11px; margin-left:8px;">Офицер: ' + escapeUstavHistoryText(rev.author) + '</span>',
          '    <span style="color:var(--muted); font-size:10.5px; margin-left:8px;">(' + dateStr + ')</span>',
          '    <div style="color:var(--muted); font-size:11px; margin-top:4px;">' + escapeUstavHistoryText(rev.description || "Изменение текста") + '</div>',
          '  </div>',
          '  <div style="display:flex; gap:6px;">',
          '    <button type="button" class="dnp-action is-secondary" data-action="revertUstavRevision" data-id="' + escapeUstavHistoryText(rev._id) + '" style="margin:0; padding:3px 8px; font-size:10.5px;">ОТКАТИТЬ</button>',
          '    <button type="button" class="dnp-action is-danger" data-action="deleteUstavRevisionRecord" data-id="' + escapeUstavHistoryText(rev._id) + '" style="margin:0; padding:3px 8px; font-size:10.5px;" aria-label="Удалить запись ревизии">УДАЛИТЬ</button>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      cont.innerHTML = '<div style="color:var(--danger); font-size:11.5px;">Ошибка загрузки истории правок.</div>';
    }
  };

  app.revertUstavRevision = async function(revId) {
    if (!confirm("Откатить состояние раздела к этой ревизии?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/ustav/revert/" + revId, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось откатить ревизию.");
      if (typeof data.html !== "string") throw new Error("У выбранной ревизии нет сохраненного снимка содержимого.");
      var restoredPanel = Array.from(document.querySelectorAll('[data-screen-panel^="ustav-"]')).find(function(panel) {
        return panel.getAttribute("data-screen-panel") === data.sectionId;
      });
      var restoredContent = restoredPanel && restoredPanel.querySelector(".dnp-screen-content");
      if (restoredContent) {
        var restoredTemplate = document.createElement("template");
        restoredTemplate.innerHTML = sanitizeUstavHtml(data.html);
        stripTemporaryUstavSelection(restoredTemplate.content);
        restoredContent.innerHTML = restoredTemplate.innerHTML;
      }
      await loadDynamicUstav(true);
      takeUstavSnapshot();
      await app.loadUstavHistory();
      alert("Раздел успешно откачен!");
    } catch (e) {
      alert(e.message || "Ошибка сети");
    }
  };

  app.deleteUstavRevisionRecord = async function(revId) {
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await window.DnpApi.request(API_BASE + "/api/admin/ustav/history/" + revId, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      app.loadUstavHistory();
    } catch (e) {}
  };

  function setSectionStatus(message, isError) {
    var status = document.getElementById("dnp-section-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  app.navPromptAddSection = function() {
    var modal = document.getElementById("dnp-add-section-modal");
    var status = document.getElementById("dnp-add-section-status");
    if (!modal) return;
    if (status) status.textContent = "";
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
    var idInput = document.getElementById("dnp-new-section-id");
    if (idInput) idInput.focus();
  };

  app.closeAddSectionModal = function() {
    var modal = document.getElementById("dnp-add-section-modal");
    if (!modal) return;
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
  };

  var addSectionForm = document.getElementById("dnp-add-section-form");
  if (addSectionForm) {
    addSectionForm.addEventListener("submit", async function(event) {
      event.preventDefault();
      var idInput = document.getElementById("dnp-new-section-id");
      var titleInput = document.getElementById("dnp-new-section-title");
      var status = document.getElementById("dnp-add-section-status");
      var sectionId = idInput ? idInput.value.trim().toLowerCase() : "";
      var title = titleInput ? titleInput.value.trim() : "";
      if (!/^[a-z0-9][a-z0-9-]*$/.test(sectionId) || !title) {
        if (status) status.textContent = "Укажите корректный ID (латиница, цифры, дефис) и название.";
        return;
      }

      var token = localStorage.getItem("dnp_auth_token");
      if (!token) {
        if (status) status.textContent = "Требуется авторизация офицера.";
        return;
      }
      try {
        var res = await window.DnpApi.request(API_BASE + "/api/admin/ustav/sections/save", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ sectionId: sectionId, title: title, headTitle: title, order: allUstavSections.length + 1 })
        });
        var data = await res.json().catch(function() { return {}; });
        if (!res.ok) throw new Error(data.error || "Не удалось создать раздел.");
        if (idInput) idInput.value = "";
        if (titleInput) titleInput.value = "";
        app.closeAddSectionModal();
        setSectionStatus("", false);
        await loadUstavSections();
      } catch (error) {
        if (status) status.textContent = error.message;
      }
    });
  }

  app.navDeleteSection = async function(secId) {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) {
      setSectionStatus("Требуется авторизация офицера.", true);
      return;
    }
    var section = allUstavSections.find(function(item) { return item.sectionId === secId; });
    var panel = Array.from(document.querySelectorAll('[data-screen-panel^="ustav-"]')).find(function(item) {
      return item.getAttribute("data-screen-panel") === secId;
    });
    var main = document.querySelector("main.dnp-main");
    var content = panel && panel.querySelector(".dnp-screen-content");
    var contentClone = content ? content.cloneNode(true) : null;
    if (contentClone) stripContenteditable(contentClone);
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/admin/ustav/sections/" + encodeURIComponent(secId), {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      var data = await res.json().catch(function() { return {}; });
      if (!res.ok) throw new Error(data.error || "Не удалось удалить раздел.");
      undoStack.push({
        type: "section",
        section: section || { sectionId: secId, title: secId, headTitle: secId, order: allUstavSections.length + 1 },
        panel: panel,
        parent: main,
        nextSibling: panel ? panel.nextSibling : null,
        previousSibling: panel ? panel.previousSibling : null,
        html: contentClone ? contentClone.innerHTML : ""
      });
      var nextSection = allUstavSections.filter(function(item) { return item.sectionId !== secId; })
        .sort(function(a, b) { return (a.order || 0) - (b.order || 0); })[0];
      if (panel && panel.classList.contains("is-visible")) {
        app.openScreen(nextSection ? nextSection.sectionId : "forms-gui");
      }
      setSectionStatus("", false);
      await loadUstavSections();
    } catch (error) {
      setSectionStatus(error.message, true);
      console.error("Не удалось удалить раздел:", error);
    }
  };

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
  var baseUstavContent = {};

  document.querySelectorAll('[data-screen-panel^="ustav-"]').forEach(function(panel) {
    var sectionId = panel.getAttribute("data-screen-panel");
    var content = panel.querySelector(".dnp-screen-content");
    if (content) baseUstavContent[sectionId] = content.innerHTML;
  });

  async function loadUstavSections() {
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/ustav/sections");
      if (!res.ok) throw new Error("HTTP " + res.status);
      var list = await res.json();
      if (!Array.isArray(list)) throw new Error("Invalid section list response.");
      allUstavSections = list;
      setSectionStatus("", false);
    } catch (error) {
      setSectionStatus("Разделы не синхронизированы с сервером.", true);
      console.error("Не удалось загрузить разделы устава:", error.message);
    }
    renderUstavNavigation();
  }

  function renderUstavNavigation() {
    var subnav = document.querySelector(".dnp-subnav");
    var main = document.querySelector("main.dnp-main");
    if (!subnav || !main) return;
    var visiblePanel = document.querySelector('[data-screen-panel^="ustav-"].is-visible');
    var activeScreenId = visiblePanel ? visiblePanel.getAttribute("data-screen-panel") : "";
    var orderedSections = allUstavSections.slice().sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
    var sectionIds = new Set(orderedSections.map(function(section) { return section.sectionId; }));
    subnav.replaceChildren();

    orderedSections.forEach(function(sec) {
      var panel = Array.from(document.querySelectorAll('[data-screen-panel^="ustav-"]')).find(function(item) {
        return item.getAttribute("data-screen-panel") === sec.sectionId;
      });
      if (panel) {
        var headH1 = panel.querySelector(".dnp-screen-head h1");
        if (headH1) headH1.textContent = sec.headTitle || sec.title;
      } else {
        panel = document.createElement("section");
        panel.className = "dnp-screen";
        panel.setAttribute("data-screen-panel", sec.sectionId);
        panel.id = "panel-" + sec.sectionId;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", "tab-" + sec.sectionId);
        var heading = document.createElement("div");
        heading.className = "dnp-screen-head";
        var title = document.createElement("h1");
        title.textContent = sec.headTitle || sec.title;
        heading.appendChild(title);
        var content = document.createElement("div");
        content.className = "dnp-screen-content";
        content.innerHTML = '<div class="dnp-brud-note"><span class="dnp-brud-tag">ИНФОРМАЦИЯ</span><span>Более подробно о каждом пункте можете узнать в <a href="https://docs.google.com/document/d/1E0ettcqE--eQjUvUlX4ZIv9UmGBjjXD7QLfmqlYDgAE/edit?tab=t.3eryletig9pf" target="_blank" class="dnp-brud-link"><strong>БРУД</strong></a>.</span></div>';
        panel.append(heading, content);
        main.insertBefore(panel, document.querySelector('[data-screen-panel="forms-gui"]'));
      }

      var wrapper = document.createElement("div");
      wrapper.className = "dnp-subnav-item-wrap";
      var button = document.createElement("button");
      button.type = "button";
      button.id = "tab-" + sec.sectionId;
      button.setAttribute("data-screen", sec.sectionId);
      button.setAttribute("aria-controls", "panel-" + sec.sectionId);
      button.setAttribute("role", "tab");
      button.classList.toggle("is-active", sec.sectionId === activeScreenId);
      button.setAttribute("aria-selected", sec.sectionId === activeScreenId ? "true" : "false");
      button.textContent = sec.title;
      var deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "dnp-sec-del-btn";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", "Удалить раздел " + sec.title);
      deleteButton.dataset.action = "navDeleteSection";
      deleteButton.dataset.sectionId = sec.sectionId;
      wrapper.append(button, deleteButton);
      subnav.appendChild(wrapper);
    });

    Array.from(main.querySelectorAll('[data-screen-panel^="ustav-"]')).forEach(function(panel) {
      if (!sectionIds.has(panel.getAttribute("data-screen-panel"))) panel.remove();
    });
    if (orderedSections.length === 0) {
      subnav.textContent = "";
      return;
    }
  }

  async function loadDynamicUstav(forceReload) {
    if (isEditorModeActive && !forceReload) return;
    try {
      var res = await window.DnpApi.request(API_BASE + "/api/ustav/all-content");
      if (!res.ok) throw new Error("HTTP " + res.status);
      var sections = await res.json();
      if (!Array.isArray(sections)) throw new Error("Invalid section content response.");

      document.querySelectorAll('[data-screen-panel^="ustav-"]').forEach(function(panel) {
        var sectionId = panel.getAttribute("data-screen-panel");
        var content = panel.querySelector(".dnp-screen-content");
        if (content && Object.prototype.hasOwnProperty.call(baseUstavContent, sectionId)) {
          content.innerHTML = baseUstavContent[sectionId];
        }
      });

      sections.forEach(function(sec) {
        var panel = findUstavContent(sec.sectionId);
        if (panel && typeof sec.html === "string") {
          var template = document.createElement("template");
          template.innerHTML = sanitizeUstavHtml(sec.html);
          stripTemporaryUstavSelection(template.content);
          panel.innerHTML = template.innerHTML;
        }
      });
      if (isEditorModeActive) enableInlineEditing();
      else stripContenteditable(document);
    } catch (e) {
      console.error("Не удалось загрузить содержимое устава:", e);
    }
  }

  app.restoreUstavBaseline = async function() {
    if (!confirm("Удалить пользовательские разделы и вернуть исходное содержимое раздела 1?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) {
      alert("Требуется авторизация офицера.");
      return;
    }

    try {
      var response = await window.DnpApi.request(API_BASE + "/api/admin/ustav/restore-baseline", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      var result = await response.json().catch(function() { return {}; });
      if (!response.ok) throw new Error(result.error || "Не удалось восстановить базовый устав.");
      await loadUstavSections();
      await loadDynamicUstav(true);
      app.openScreen("ustav-01");
      alert("Базовый устав восстановлен. Удалено дополнительных разделов: " + (result.removedSections || 0) + ".");
    } catch (error) {
      alert(error.message || "Не удалось восстановить базовый устав.");
      console.error("Ошибка восстановления базового устава:", error);
    }
  };

  document.addEventListener("click", function(event) {
    var control = event.target.closest("[data-action]");
    if (!control) return;
    var action = control.dataset.action;
    var id = control.dataset.id;
    event.preventDefault();

    if (action === "openScreen") app.openScreen(control.dataset.screenName);
    else if (action === "switchAdminTicketTab") app.switchAdminTicketTab(control.dataset.tab);
    else if (action === "toggleUstavEditorMode") app.toggleUstavEditorMode(control.dataset.state === "true");
    else if (action === "docFormat") app.docFormat(control.dataset.command);
    else if (action === "docInsertItem") app.docInsertItem(control.dataset.type);
    else if (action === "moveActiveSection") app.moveActiveSection(Number(control.dataset.direction));
    else if (action === "respondAdminTicket") app.respondAdminTicket(control.dataset.reportId, control.dataset.status);
    else if (action === "deleteAdminTicket") app.deleteAdminTicket(control.dataset.reportId);
    else if (action === "deleteAdminUser") app.deleteAdminUser(control.dataset.id);
    else if (action === "removeAdminOfficer") app.removeAdminOfficer(control.dataset.nick);
    else if (action === "deleteAdminUstav") app.deleteAdminUstav(control.dataset.id);
    else if (action === "deleteNotification") app.deleteNotification(event, id);
    else if (action === "markNotificationRead") app.markNotificationRead(id);
    else if (action === "revertUstavRevision") app.revertUstavRevision(id);
    else if (action === "deleteUstavRevisionRecord") app.deleteUstavRevisionRecord(id);
    else if (action === "navDeleteSection") app.navDeleteSection(control.dataset.sectionId);
    else if (action === "toggleTicket") control.classList.toggle("is-open");
    else if (action === "toggleNavDrawer") {
      var layoutElement = document.getElementById("dnp-layout");
      if (layoutElement) {
        var isOpen = layoutElement.classList.toggle("is-nav-open");
        control.setAttribute("aria-expanded", String(isOpen));
      }
    } else if (typeof app[action] === "function") app[action]();
  });

  document.addEventListener("click", function(event) {
    var layoutElement = document.getElementById("dnp-layout");
    var sidebar = document.getElementById("dnp-sidebar");
    var navToggle = document.querySelector(".dnp-nav-toggle");
    if (!layoutElement || !sidebar || !layoutElement.classList.contains("is-nav-open")) return;
    if (sidebar.contains(event.target) || (navToggle && navToggle.contains(event.target))) return;
    layoutElement.classList.remove("is-nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("change", function(event) {
    var control = event.target.closest("[data-action-change]");
    if (!control) return;
    var action = control.dataset.actionChange;
    if (typeof app[action] === "function") app[action](control.value);
  });

  root.addEventListener("keydown", function(event) {
    var control = event.target.closest('[data-action="toggleTicket"]');
    if (control && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      control.classList.toggle("is-open");
    }
  });

  var diagram = document.querySelector(".dnp-platc-img");
  if (diagram) {
    diagram.addEventListener("error", function() {
      var fallbacks = ["assets/image/plach.jpg", "assets/image/plach"];
      var nextIndex = Number(diagram.dataset.fallbackIndex || 0);
      if (fallbacks[nextIndex]) {
        diagram.dataset.fallbackIndex = String(nextIndex + 1);
        diagram.src = fallbacks[nextIndex];
      }
    });
  }

  async function refreshUstavContent() {
    await loadUstavSections();
    await loadDynamicUstav();
    window.setTimeout(refreshUstavContent, 25000);
  }

  refreshUstavContent();
})();