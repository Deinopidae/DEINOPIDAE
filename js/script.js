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

  window.openScreen = function(name) {
    if (isTransitioning) return;

    var targetPanel = root.querySelector('[data-screen-panel="' + name + '"]');
    if (!targetPanel) return;

    var isExternal = ["forms-gui", "tickets", "notifications", "admin-panel"].indexOf(name) !== -1;
    var ustavNav = document.getElementById("dnp-nav-ustav");
    var ustavStatus = document.getElementById("dnp-ustav-status");

    if (isExternal) {
      if (ustavNav) {
        ustavNav.removeAttribute("open");
        if (ustavStatus) ustavStatus.textContent = "CLOSED";
      }
    } else if (name.indexOf("ustav-") === 0) {
      if (ustavNav) {
        ustavNav.setAttribute("open", "");
        if (ustavStatus) ustavStatus.textContent = "OPEN";
      }
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

  var myTicketsCache = [];
  var currentTicketFilter = 'ALL';

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
          '    <span class="dnp-ticket-status ' + stClass + '">' + (t.status || "НА ПРОВЕРКЕ") + '</span>',
          '  </div>',
          '  <div class="dnp-ticket-history">',
          '    <div><span style="color:var(--line);">Суть:</span> ' + t.description + '</div>',
          t.links && t.links !== "Отсутствуют" ? '    <div><span style="color:var(--line);">Материалы:</span> <a href="' + t.links + '" target="_blank" class="dnp-brud-link">Открыть вложение ↗</a></div>' : '',
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

  window.filterRenderTickets = function() {
    var cont = document.getElementById("tickets-list-container");
    if (!cont) return;

    var q = (document.getElementById("tickets-search-input")?.value || "").toLowerCase().trim();
    var list = myTicketsCache.filter(function(t) {
      var matchStatus = currentTicketFilter === 'ALL' || t.status === currentTicketFilter;
      var matchQuery = !q || (t.reportId && t.reportId.toLowerCase().indexOf(q) !== -1) ||
                              (t.description && t.description.toLowerCase().indexOf(q) !== -1) ||
                              (t.officer && t.officer.toLowerCase().indexOf(q) !== -1);
      return matchStatus && matchQuery;
    });

    document.getElementById("t-count-all").textContent = myTicketsCache.length;
    document.getElementById("t-count-pending").textContent = myTicketsCache.filter(t => t.status === 'НА ПРОВЕРКЕ').length;
    document.getElementById("t-count-work").textContent = myTicketsCache.filter(t => t.status === 'В РАБОТЕ').length;
    document.getElementById("t-count-approved").textContent = myTicketsCache.filter(t => t.status === 'ОДОБРЕНО').length;
    document.getElementById("t-count-rejected").textContent = myTicketsCache.filter(t => t.status === 'ОТКЛОНЕНО').length;

    if (list.length === 0) {
      cont.innerHTML = '<div style="color:var(--muted); font-size:13px; padding:12px 0;">Обращений по данному критерию не найдено.</div>';
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
        '<div class="dnp-ticket-box">',
        '  <div class="dnp-ticket-top" onclick="this.parentElement.querySelector(\'.dnp-ticket-details\').classList.toggle(\'dnp-hidden\')">',
        '    <div>',
        '      <b>' + t.type + ' <span style="color:var(--muted); font-size:11px;">(#' + t.reportId + ')</span></b>',
        '      <span style="color:var(--muted); font-size:11px; margin-left:8px;">' + dateSubmit + '</span>',
        '    </div>',
        '    <span class="dnp-badge ' + stClass + '">' + (t.status || "НА ПРОВЕРКЕ") + '</span>',
        '  </div>',
        '  <div class="dnp-ticket-details">',
        '    <div><span style="color:var(--line);">Суть:</span> ' + t.description + '</div>',
        t.links && t.links !== "Отсутствуют" ? '    <div><span style="color:var(--line);">Материалы:</span> <a href="' + t.links + '" target="_blank" class="dnp-brud-link">Открыть вложение ↗</a></div>' : '',
        t.officer ? '    <div style="margin-top:4px; padding-top:6px; border-top:1px dashed var(--line-soft);"><span style="color:var(--line);">Офицер:</span> ' + t.officer + ' (' + dateUpdate + ')</div>' : '',
        t.officerComment ? '    <div class="dnp-ticket-verdict-box"><span style="color:var(--line);">Вердикт офицера:</span> <b style="color:#fff;">' + t.officerComment + '</b></div>' : '',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');
  };

  document.querySelectorAll("#tickets-filter-bar button").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll("#tickets-filter-bar button").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentTicketFilter = btn.getAttribute("data-ticket-filter");
      filterRenderTickets();
    });
  });

  var myNotifsCache = [];
  var currentNotifFilter = 'ALL';

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
          '    <span class="dnp-notif-time">' + dateStr + '</span>',
          '  </div>',
          '  <div class="dnp-notif-msg">' + n.message + '</div>',
          '</div>'
        ].join('');
      }).join('');
    } catch (e) {
      if (cont) cont.innerHTML = '<div style="color:var(--danger); font-size:12.5px;">Ошибка загрузки уведомлений.</div>';
    }
  };

  window.filterRenderNotifs = function() {
    var cont = document.getElementById("notifications-list-container");
    if (!cont) return;

    var list = myNotifsCache.filter(function(n) {
      if (currentNotifFilter === 'UNREAD') return !n.isRead;
      if (currentNotifFilter === 'TICKET') return n.type === 'TICKET' || n.type === 'SUCCESS' || n.type === 'WARNING';
      if (currentNotifFilter === 'SYSTEM') return n.type === 'SYSTEM';
      return true;
    });

    document.getElementById("n-count-all").textContent = myNotifsCache.length;
    document.getElementById("n-count-unread").textContent = myNotifsCache.filter(n => !n.isRead).length;
    document.getElementById("n-count-ticket").textContent = myNotifsCache.filter(n => n.type === 'TICKET' || n.type === 'SUCCESS' || n.type === 'WARNING').length;
    document.getElementById("n-count-sys").textContent = myNotifsCache.filter(n => n.type === 'SYSTEM').length;

    if (list.length === 0) {
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
        '    <span class="dnp-notif-time">' + dateStr + '</span>',
        '  </div>',
        '  <div class="dnp-notif-msg">' + n.message + '</div>',
        '</div>'
      ].join('');
    }).join('');
  };

  document.querySelectorAll("#notifs-filter-bar button").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll("#notifs-filter-bar button").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentNotifFilter = btn.getAttribute("data-notif-filter");
      filterRenderNotifs();
    });
  });

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

    var defaultOfficers = ["xxartemrtxxx", "tds_masterfarm", "egorik0130", "jeiso"];
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
          t.links && t.links !== 'Отсутствуют' ? '<div style="font-size:11.5px;"><a href="' + t.links + '" target="_blank" class="dnp-brud-link">Материалы ↗</a></div>' : '',
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

  var floatEditor = document.getElementById("dnp-floating-editor");
  var floatHeader = document.getElementById("dnp-float-hud-header");
  var floatMinBtn = document.getElementById("dnp-float-min-btn");
  var floatCloseBtn = document.getElementById("dnp-float-close-btn");

  var activeFloatSectionId = 'ustav-01';
  var allUstavSections = [];
  var allUstavItemsCache = [];

  var isDragging = false;
  var dragOffsetX = 0;
  var dragOffsetY = 0;

  if (floatHeader && floatEditor) {
    floatHeader.addEventListener("mousedown", function(e) {
      if (e.target.closest("button")) return;
      isDragging = true;
      var rect = floatEditor.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", function(e) {
      if (!isDragging) return;
      var newLeft = e.clientX - dragOffsetX;
      var newTop = e.clientY - dragOffsetY;

      newLeft = Math.max(10, Math.min(window.innerWidth - floatEditor.offsetWidth - 10, newLeft));
      newTop = Math.max(10, Math.min(window.innerHeight - floatEditor.offsetHeight - 10, newTop));

      floatEditor.style.left = newLeft + "px";
      floatEditor.style.top = newTop + "px";
      floatEditor.style.right = "auto";
    });

    document.addEventListener("mouseup", function() {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = "";
      }
    });

    if (floatMinBtn) {
      floatMinBtn.addEventListener("click", function() {
        floatEditor.classList.toggle("is-minimized");
        floatMinBtn.textContent = floatEditor.classList.contains("is-minimized") ? "+" : "−";
      });
    }

    if (floatCloseBtn) {
      floatCloseBtn.addEventListener("click", function() {
        floatEditor.style.display = "none";
      });
    }
  }

  window.openFloatingUstavEditor = function() {
    if (!floatEditor) return;
    floatEditor.style.display = "flex";
    floatEditor.classList.remove("is-minimized");
    if (floatMinBtn) floatMinBtn.textContent = "−";
    loadFloatData();
  };

  window.openFloatingUstavEditorWithItem = function(item) {
    openFloatingUstavEditor();
    activeFloatSectionId = item.sectionId;
    renderFloatSections();
    renderFloatArticles();
    editFloatArticle(item);
  };

  async function loadFloatData() {
    try {
      var secRes = await fetch(API_BASE + "/api/ustav/sections");
      if (secRes.ok) {
        var sData = await secRes.json();
        if (Array.isArray(sData) && sData.length > 0) allUstavSections = sData;
      }
    } catch (e) {}

    try {
      var artRes = await fetch(API_BASE + "/api/ustav");
      if (artRes.ok) {
        var aData = await artRes.json();
        if (Array.isArray(aData)) allUstavItemsCache = aData;
      }
    } catch (e) {}

    renderFloatSections();
    renderFloatArticles();
  }

  function renderFloatSections() {
    var cont = document.getElementById("float-sections-list");
    if (!cont) return;

    cont.innerHTML = allUstavSections.map(function(s, idx) {
      var isActive = s.sectionId === activeFloatSectionId ? "is-active" : "";
      return [
        '<div class="dnp-float-sec-row ' + isActive + '" onclick="selectFloatSection(\'' + s.sectionId + '\')">',
        '  <div>',
        '    <b>' + s.title + '</b>',
        '    <span style="font-size:10px; color:var(--muted); margin-left:6px;">[' + s.sectionId + ']</span>',
        '  </div>',
        '  <div class="dnp-float-order-ctrls" onclick="event.stopPropagation()">',
        idx > 0 ? '    <button type="button" class="dnp-float-arrow-btn" onclick="moveFloatSection(' + idx + ', -1)">▲</button>' : '',
        idx < allUstavSections.length - 1 ? '    <button type="button" class="dnp-float-arrow-btn" onclick="moveFloatSection(' + idx + ', 1)">▼</button>' : '',
        s.isCustom ? '    <button type="button" class="dnp-float-arrow-btn" style="color:var(--danger);" onclick="deleteFloatSection(\'' + s.sectionId + '\')">✕</button>' : '',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');
  }

  window.selectFloatSection = function(secId) {
    activeFloatSectionId = secId;
    renderFloatSections();
    renderFloatArticles();
    var secObj = allUstavSections.find(s => s.sectionId === secId);
    var label = document.getElementById("float-active-section-label");
    if (label && secObj) label.textContent = 'СТАТЬИ: ' + secObj.title.toUpperCase();
  };

  window.toggleFloatNewSection = function() {
    var box = document.getElementById("float-new-section-box");
    if (box) box.style.display = box.style.display === "none" ? "block" : "none";
  };

  window.saveFloatNewSection = async function() {
    var token = localStorage.getItem("dnp_auth_token");
    var id = document.getElementById("float-sec-new-id").value.trim().toLowerCase();
    var title = document.getElementById("float-sec-new-title").value.trim();
    var order = parseInt(document.getElementById("float-sec-new-order").value, 10);

    if (!id || !title) return alert("Заполните ID и название раздела");

    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/sections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ sectionId: id, title: title, headTitle: title, order: isNaN(order) ? 99 : order })
      });
      if (res.ok) {
        document.getElementById("float-sec-new-id").value = "";
        document.getElementById("float-sec-new-title").value = "";
        toggleFloatNewSection();
        loadFloatData();
        loadDynamicUstav();
      }
    } catch (e) {}
  };

  window.deleteFloatSection = async function(secId) {
    if (!confirm("Удалить раздел " + secId + "?")) return;
    var token = localStorage.getItem("dnp_auth_token");
    try {
      await fetch(API_BASE + "/api/admin/ustav/sections/" + secId, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });
      activeFloatSectionId = 'ustav-01';
      loadFloatData();
      loadDynamicUstav();
    } catch (e) {}
  };

  window.moveFloatSection = async function(idx, dir) {
    var targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= allUstavSections.length) return;
    var temp = allUstavSections[idx];
    allUstavSections[idx] = allUstavSections[targetIdx];
    allUstavSections[targetIdx] = temp;

    var token = localStorage.getItem("dnp_auth_token");
    for (var i = 0; i < allUstavSections.length; i++) {
      allUstavSections[i].order = i + 1;
      fetch(API_BASE + "/api/admin/ustav/sections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify(allUstavSections[i])
      });
    }
    renderFloatSections();
    renderUstavNavigation();
  };

  function renderFloatArticles() {
    var cont = document.getElementById("float-articles-container");
    if (!cont) return;

    var list = allUstavItemsCache.filter(item => item.sectionId === activeFloatSectionId);
    if (list.length === 0) {
      cont.innerHTML = '<div style="color:var(--muted); font-size:11px; padding:6px;">В этом разделе пока нет кастомных статей. Нажмите "+ ДОБАВИТЬ СТАТЬЮ".</div>';
      return;
    }

    cont.innerHTML = list.map(function(item, idx) {
      var borderColor = item.borderColor || 'var(--line)';
      return [
        '<div class="dnp-float-sec-row" style="border-left: 3px solid ' + borderColor + ';" onclick=\'editFloatArticle(' + JSON.stringify(item) + ')\'>',
        '  <div>',
        '    <b>' + item.num + ' ' + item.title + '</b>',
        '    <span style="font-size:10px; color:var(--muted); margin-left:6px;">[' + item.tag + ']</span>',
        '  </div>',
        '  <div class="dnp-float-order-ctrls" onclick="event.stopPropagation()">',
        idx > 0 ? '    <button type="button" class="dnp-float-arrow-btn" onclick="moveFloatArticle(' + idx + ', -1)">▲</button>' : '',
        idx < list.length - 1 ? '    <button type="button" class="dnp-float-arrow-btn" onclick="moveFloatArticle(' + idx + ', 1)">▼</button>' : '',
        '    <button type="button" class="dnp-float-arrow-btn" style="color:var(--danger);" onclick="deleteAdminUstav(\'' + item._id + '\')">✕</button>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');
  }

  window.moveFloatArticle = async function(idx, dir) {
    var list = allUstavItemsCache.filter(item => item.sectionId === activeFloatSectionId);
    var targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    var temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    var token = localStorage.getItem("dnp_auth_token");
    for (var i = 0; i < list.length; i++) {
      list[i].order = i + 1;
      await fetch(API_BASE + "/api/admin/ustav/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify(list[i])
      });
    }
    loadFloatData();
    loadDynamicUstav();
  };

  window.newFloatArticle = function() {
    resetFloatArticleForm();
    document.getElementById("float-inspector-target").textContent = '[НОВАЯ СТАТЬЯ ДЛЯ ' + activeFloatSectionId + ']';
  };

  window.editFloatArticle = function(item) {
    document.getElementById("float-art-id").value = item._id;
    document.getElementById("float-art-num").value = item.num;
    document.getElementById("float-art-tag").value = item.tag;
    document.getElementById("float-art-title").value = item.title;
    document.getElementById("float-art-text").value = item.text;
    document.getElementById("float-art-order").value = item.order || 0;
    document.getElementById("float-color-border").value = item.borderColor || "#00f0ff";
    document.getElementById("float-color-text").value = item.textColor || "#d9e1e4";
    document.getElementById("float-color-bg").value = item.highlightColor || "#080d10";
    document.getElementById("float-inspector-target").textContent = '[РЕДАКТИРОВАНИЕ: ' + item.num + ']';
  };

  window.resetFloatArticleForm = function() {
    document.getElementById("float-art-id").value = "";
    document.getElementById("float-art-num").value = "";
    document.getElementById("float-art-tag").value = "ACTIVE";
    document.getElementById("float-art-title").value = "";
    document.getElementById("float-art-text").value = "";
    document.getElementById("float-art-order").value = "";
    document.getElementById("float-color-border").value = "#8aa0a8";
    document.getElementById("float-color-text").value = "#d9e1e4";
    document.getElementById("float-color-bg").value = "#080d10";
    document.getElementById("float-inspector-target").textContent = '[НОВАЯ]';
  };

  window.saveFloatArticle = async function() {
    var token = localStorage.getItem("dnp_auth_token");
    var id = document.getElementById("float-art-id").value;
    var num = document.getElementById("float-art-num").value.trim();
    var tag = document.getElementById("float-art-tag").value.trim() || 'ACTIVE';
    var title = document.getElementById("float-art-title").value.trim();
    var text = document.getElementById("float-art-text").value.trim();
    var order = parseInt(document.getElementById("float-art-order").value, 10);
    var borderColor = document.getElementById("float-color-border").value;
    var textColor = document.getElementById("float-color-text").value;
    var highlightColor = document.getElementById("float-color-bg").value;

    if (!num || !title || !text) return alert("Заполните номер, заголовок и текст статьи");

    try {
      var res = await fetch(API_BASE + "/api/admin/ustav/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          id: id,
          sectionId: activeFloatSectionId,
          num: num,
          tag: tag,
          title: title,
          text: text,
          order: isNaN(order) ? 0 : order,
          borderColor: borderColor,
          textColor: textColor,
          highlightColor: highlightColor
        })
      });
      if (res.ok) {
        resetFloatArticleForm();
        loadFloatData();
        loadDynamicUstav();
        loadAdminUstav();
      }
    } catch (e) {}
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
  allUstavSections = DEFAULT_SECTIONS.slice();

  async function loadUstavSections() {
    try {
      var res = await fetch(API_BASE + "/api/ustav/sections");
      if (res.ok) {
        var list = await res.json();
        if (Array.isArray(list) && list.length > 0) allUstavSections = list;
      }
    } catch (e) {}
    renderUstavNavigation();
  }

  function renderUstavNavigation() {
    var subnav = document.querySelector(".dnp-subnav");
    if (!subnav || allUstavSections.length === 0) return;

    allUstavSections.sort((a,b) => (a.order || 0) - (b.order || 0)).forEach(function(sec) {
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
            '  <div class="dnp-brud-note"><span class="dnp-brud-tag">ИНФОРМАЦИЯ</span><span>Более подробно о каждом пункте можете узнать в <a href="https://docs.google.com/document/d/1E0ettcqE--eQjUvUlX4ZIv9UmGBjjXD7QLfmqlYDgAE/edit?tab=t.3eryletig9pf" target="_blank" class="dnp-brud-link"><strong>БРУД ↗</strong></a>.</span></div>',
            '</div>'
          ].join('');
          main.insertBefore(newSec, document.querySelector('[data-screen-panel="forms-gui"]') || null);
        }
      }
    });
  }

  async function loadDynamicUstav() {
    try {
      var res = await fetch(API_BASE + "/api/ustav");
      var list = await res.json();
      if (!list || !Array.isArray(list)) return;
      document.querySelectorAll(".dnp-dyn-module").forEach(function(el) { el.remove(); });
      
      list.sort((a,b) => (a.order || 0) - (b.order || 0)).forEach(function(item) {
        var panel = document.querySelector('[data-screen-panel="' + item.sectionId + '"] .dnp-screen-content');
        if (!panel) return;
        var art = document.createElement("article");
        art.className = "dnp-module dnp-dyn-module";
        
        var customStyles = [];
        if (item.borderColor) customStyles.push('border-left-color: ' + item.borderColor);
        if (item.highlightColor) customStyles.push('background: ' + item.highlightColor);
        if (customStyles.length > 0) art.setAttribute('style', customStyles.join('; '));

        var textStyle = item.textColor ? 'style="color:' + item.textColor + ';"' : '';

        art.innerHTML = [
          '<div class="dnp-module-title">',
          '  <span>' + item.num + '</span>',
          '  <b>' + item.title + '</b>',
          '  <em>' + item.tag + '</em>',
          '</div>',
          '<p ' + textStyle + '>' + item.text + '</p>'
        ].join('');

        var note = panel.querySelector(".dnp-brud-note");
        if (note) {
          panel.insertBefore(art, note);
        } else {
          panel.appendChild(art);
        }
      });
    } catch (e) {}
  }

  loadUstavSections();
  loadDynamicUstav();
  setInterval(function() {
    loadUstavSections();
    loadDynamicUstav();
  }, 25000);
})();