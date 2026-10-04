(function () {
  var loader = document.getElementById("dnp-loader");
  var loaderBar = document.getElementById("loader-bar");
  var loaderPercent = document.getElementById("loader-percent");
  var loaderPin = document.getElementById("loader-pin");
  var loaderBg = document.getElementById("loader-bg");
  var loaderWipe = document.getElementById("loader-wipe");
  var loaderContent = document.getElementById("loader-content");

  // Проверка сессии: если КПК уже загружался в этой вкладке, анимация пропускается
  if (sessionStorage.getItem("dnp_pda_booted") === "true") {
    if (loader) loader.style.display = "none";
  } else if (loader && loaderBar && loaderPercent && loaderPin && loaderBg && loaderWipe) {
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
      sessionStorage.setItem("dnp_pda_booted", "true");
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

  var isTransitioning = false;

  window.openScreen = function (name) {
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

    // Если открываем экран профиля, тикетов или настроек, проверяем токен
    var token = localStorage.getItem("dnp_auth_token");
    if ((name === "profile" || name === "settings" || name === "tickets") && !token) {
      window.openScreen("auth");
      return;
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
          });

          if (curHead) curHead.classList.remove("head-slide-out");

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

          root.querySelectorAll("[data-screen]").forEach(function (button) {
            var isActive = button.getAttribute("data-screen") === name;
            button.classList.toggle("is-active", isActive);
          });

          if (name === "database") initTerminalBoot();
          if (name === "profile") loadProfileScreenData();
          if (name === "settings") loadSettingsScreenData();
          if (name === "tickets") loadTicketsScreenData();
        } finally {
          isTransitioning = false;
        }
      }, 240);
    } else {
      panels.forEach(function (panel) {
        var isActive = panel === targetPanel;
        panel.classList.toggle("is-visible", isActive);
      });

      root.querySelectorAll("[data-screen]").forEach(function (button) {
        var isActive = button.getAttribute("data-screen") === name;
        button.classList.toggle("is-active", isActive);
      });

      if (name === "database") initTerminalBoot();
      if (name === "profile") loadProfileScreenData();
      if (name === "settings") loadSettingsScreenData();
      if (name === "tickets") loadTicketsScreenData();
    }
  };

  root.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-screen]");
    if (trigger && !trigger.disabled) {
      var screenName = trigger.getAttribute("data-screen");
      window.openScreen(screenName);
    }
  });

  if (window.location.search.indexOf("open=terminal") !== -1) {
    window.openScreen("database");
  } else {
    var firstButton = root.querySelector('[data-screen].is-active') || root.querySelector('[data-screen]:not([disabled])');
    if (firstButton) {
      window.openScreen(firstButton.getAttribute("data-screen"));
    }
  }

  // ========================================================
  // ЭКРАНЫ ПРОФИЛЯ, НАСТРОЕК, ТИКЕТОВ И АВТОРИЗАЦИИ
  // ========================================================
  var SERVER_URL = "https://deinopidae-api.onrender.com";

  function loadProfileScreenData() {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;

    fetch(SERVER_URL + "/api/user/profile", {
      headers: { "Authorization": "Bearer " + token }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.error) return;
        var acc = data.account || {};
        var st = data.staff || {};

        document.getElementById("prof-display-name").textContent =
          (acc.displayName || acc.username).toUpperCase() + " // " + acc.roblox;

        if (acc.avatar && acc.avatar.length > 5) {
          document.getElementById("prof-avatar").src = acc.avatar;
        }

        var badge = document.getElementById("prof-activity-badge");
        badge.textContent = acc.activityStatus || "В АКТИВЕ";
        if (acc.activityStatus === "Инактив") {
          badge.className = "dnp-badge is-danger";
        } else {
          badge.className = "dnp-badge is-ok";
        }

        document.getElementById("p-rank").textContent = (st.title || "Сотрудник") + " [" + (st.rank || "Кадет") + "]";
        document.getElementById("p-norm").textContent = (st.mp || "0/0") + " МП / " + (st.hours || "0:00") + " ч.";
        document.getElementById("p-equip").textContent = (st.equipment || "0") + " ед.";
        document.getElementById("p-quota").textContent = st.quota_status || "В ОБРАБОТКЕ";
        document.getElementById("p-promo").textContent = st.promotion || "Проверяется";
        document.getElementById("p-penalties").textContent = st.penalties || "N/A";
        document.getElementById("p-coins").textContent = (st.coins || "0") + " койнов / " + (st.activity || "0") + " PTS";
      })
      .catch(function () {});
  }

  var currentAvatarBase64 = "";

  function loadSettingsScreenData() {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) return;

    fetch(SERVER_URL + "/api/user/profile", {
      headers: { "Authorization": "Bearer " + token }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.account) {
          document.getElementById("cfg-display-name").value = data.account.displayName || data.account.username;
          if (data.account.avatar && data.account.avatar.length > 5) {
            document.getElementById("cfg-avatar-preview").src = data.account.avatar;
            currentAvatarBase64 = data.account.avatar;
          }
          var radios = document.getElementsByName("pda-act-status");
          for (var i = 0; i < radios.length; i++) {
            if (radios[i].value === data.account.activityStatus) {
              radios[i].checked = true;
            }
          }
        }
      });
  }

  var cfgFile = document.getElementById("cfg-avatar-file");
  var cfgUrl = document.getElementById("cfg-avatar-url");
  var cfgPrev = document.getElementById("cfg-avatar-preview");
  var cfgSave = document.getElementById("cfg-save-btn");
  var cfgMsg = document.getElementById("cfg-status-msg");

  if (cfgFile) {
    cfgFile.addEventListener("change", function () {
      var f = cfgFile.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        cfgPrev.src = e.target.result;
        currentAvatarBase64 = e.target.result;
      };
      reader.readAsDataURL(f);
    });
  }

  if (cfgUrl) {
    cfgUrl.addEventListener("input", function () {
      var v = cfgUrl.value.trim();
      if (v.startsWith("http")) {
        cfgPrev.src = v;
        currentAvatarBase64 = v;
      }
    });
  }

  if (cfgSave) {
    cfgSave.addEventListener("click", function () {
      var token = localStorage.getItem("dnp_auth_token");
      if (!token) return;

      cfgMsg.style.color = "var(--cyan)";
      cfgMsg.textContent = "[SYS] Сохранение в dnp_auth_db...";

      var actStatus = "В активе";
      var radios = document.getElementsByName("pda-act-status");
      for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) actStatus = radios[i].value;
      }

      fetch(SERVER_URL + "/api/user/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          displayName: document.getElementById("cfg-display-name").value.trim(),
          avatar: currentAvatarBase64,
          activityStatus: actStatus
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            localStorage.setItem("dnp_active_user", JSON.stringify(res.user));
            cfgMsg.style.color = "var(--ok)";
            cfgMsg.textContent = "[УСПЕХ] Параметры сохранены.";
            if (window.renderAuthHeader) window.renderAuthHeader();
          } else {
            cfgMsg.style.color = "var(--danger-bright)";
            cfgMsg.textContent = "[ОТКАЗ] " + (res.error || "Ошибка сохранения");
          }
        })
        .catch(function () {
          cfgMsg.style.color = "var(--danger-bright)";
          cfgMsg.textContent = "[СБОЙ СЕТИ] Ошибка соединения.";
        });
    });
  }

  function loadTicketsScreenData() {
    var token = localStorage.getItem("dnp_auth_token");
    var feed = document.getElementById("tickets-feed");
    if (!feed || !token) return;

    fetch(SERVER_URL + "/api/forms/my", {
      headers: { "Authorization": "Bearer " + token }
    })
      .then(function (r) { return r.json(); })
      .then(function (tickets) {
        if (!tickets || tickets.length === 0) {
          feed.innerHTML = '<div class="dnp-module" style="padding: 14px; color: var(--muted); font-size: 12px;">Зарегистрированных обращений не найдено.</div>';
          return;
        }
        feed.innerHTML = "";
        tickets.forEach(function (t) {
          var card = document.createElement("div");
          card.className = "dnp-module";
          card.style.padding = "14px";
          var date = new Date(t.submittedAt).toLocaleString("ru-RU");

          card.innerHTML = [
            '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line-soft); padding-bottom: 6px; margin-bottom: 8px;">',
            '  <strong style="color: var(--cyan); font-family: \'Exo 2\', sans-serif;">[' + t.type + '] ' + t.reportId + '</strong>',
            '  <span class="dnp-badge is-ok">' + (t.status || 'НА ПРОВЕРКЕ') + '</span>',
            '</div>',
            '<p style="padding:0; margin: 0 0 8px; color: #fff; line-height: 1.5; font-size: 12.5px;">' + t.description + '</p>',
            '<div style="font-size: 11px; color: var(--muted); border-top: 1px solid rgba(138, 160, 168, 0.1); padding-top: 6px;">',
            '  Дата: ' + date + ' | Ссылки: ' + (t.links || 'Отсутствуют'),
            '</div>'
          ].join('');

          feed.appendChild(card);
        });
      })
      .catch(function () {
        feed.innerHTML = '<div class="dnp-module" style="padding: 14px; color: var(--danger-bright); font-size: 12px;">Ошибка доступа к базе dnp_tickets_db.</div>';
      });
  }

  var btnNewTicket = document.getElementById("tickets-open-gui-btn");
  if (btnNewTicket) {
    btnNewTicket.addEventListener("click", function () {
      showFormsGui();
    });
  }

  // Вкладки авторизации
  var tabLogin = document.getElementById("tab-login-btn");
  var tabReg = document.getElementById("tab-reg-btn");
  var formLogin = document.getElementById("form-login");
  var formReg = document.getElementById("form-register");
  var authMsg = document.getElementById("auth-msg");

  if (tabLogin && tabReg) {
    tabLogin.addEventListener("click", function () {
      tabLogin.classList.add("is-active");
      tabReg.classList.remove("is-active");
      formLogin.style.display = "flex";
      formReg.style.display = "none";
      authMsg.textContent = "";
    });

    tabReg.addEventListener("click", function () {
      tabReg.classList.add("is-active");
      tabLogin.classList.remove("is-active");
      formReg.style.display = "flex";
      formLogin.style.display = "none";
      authMsg.textContent = "";
    });
  }

  if (formReg) {
    formReg.addEventListener("submit", function (e) {
      e.preventDefault();
      var username = document.getElementById("reg-username").value.trim();
      var roblox = document.getElementById("reg-roblox").value.trim();
      var pass = document.getElementById("reg-pass").value;
      var pass2 = document.getElementById("reg-pass2").value;

      if (pass !== pass2) {
        authMsg.style.color = "var(--danger-bright)";
        authMsg.textContent = "[ОШИБКА] Введенные пароли не совпадают.";
        return;
      }

      authMsg.style.color = "var(--cyan)";
      authMsg.textContent = "[SYS] Регистрация аккаунта в комплексе...";

      fetch(SERVER_URL + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, roblox: roblox, password: pass })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            localStorage.setItem("dnp_auth_token", data.user.token);
            localStorage.setItem("dnp_active_user", JSON.stringify(data.user));
            authMsg.style.color = "var(--ok)";
            authMsg.textContent = "[УСПЕХ] Аккаунт создан! Вход выполнен.";
            if (window.renderAuthHeader) window.renderAuthHeader();
            setTimeout(function () { window.openScreen("profile"); }, 600);
          } else {
            authMsg.style.color = "var(--danger-bright)";
            authMsg.textContent = "[ОТКАЗ] " + (data.error || "Ошибка регистрации");
          }
        })
        .catch(function () {
          authMsg.style.color = "var(--danger-bright)";
          authMsg.textContent = "[СБОЙ СЕТИ] Сервер недоступен.";
        });
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      var ident = document.getElementById("login-identifier").value.trim();
      var pass = document.getElementById("login-pass").value;

      authMsg.style.color = "var(--cyan)";
      authMsg.textContent = "[SYS] Проверка учетных данных...";

      fetch(SERVER_URL + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: ident, password: pass })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            localStorage.setItem("dnp_auth_token", data.user.token);
            localStorage.setItem("dnp_active_user", JSON.stringify(data.user));
            authMsg.style.color = "var(--ok)";
            authMsg.textContent = "[УСПЕХ] Доступ разрешен!";
            if (window.renderAuthHeader) window.renderAuthHeader();
            setTimeout(function () { window.openScreen("profile"); }, 500);
          } else {
            authMsg.style.color = "var(--danger-bright)";
            authMsg.textContent = "[ОТКАЗ] " + (data.error || "Неверный логин или пароль");
          }
        })
        .catch(function () {
          authMsg.style.color = "var(--danger-bright)";
          authMsg.textContent = "[СБОЙ СЕТИ] Сервер недоступен.";
        });
    });
  }

  // ========================================================
  // ГЛИТЧ-ЭФФЕКТ ДЛЯ КОРНЕЙ
  // ========================================================
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

  // ========================================================
  // ТЕРМИНАЛ CMD
  // ========================================================
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

  window.employeeDb = {};

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

    if (termPromptLabel) termPromptLabel.textContent = getPromptStr();
    if (termPromptLine) termPromptLine.style.display = "flex";
    if (termInput) termInput.focus({ preventScroll: true });
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

  // МОДАЛЬНЫЙ GUI FORMS
  var modalBackdrop = document.getElementById("dnp-gui-modal");
  var modalTitle = document.getElementById("dnp-modal-title");
  var modalBody = document.getElementById("dnp-modal-body");
  var modalClose = document.getElementById("dnp-modal-close-btn");

  if (modalClose && modalBackdrop) {
    modalClose.addEventListener("click", function () { modalBackdrop.style.display = "none"; });
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) modalBackdrop.style.display = "none";
    });
  }

  function readFilesAsBase64(fileList) {
    var promises = [];
    for (var i = 0; i < fileList.length; i++) {
      (function (file) {
        promises.push(new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function (e) {
            resolve({ name: file.name, type: file.type, data: e.target.result });
          };
          reader.onerror = function () { resolve(null); };
          reader.readAsDataURL(file);
        }));
      })(fileList[i]);
    }
    return Promise.all(promises);
  }

  function showFormsGui() {
    if (!modalBackdrop || !modalBody) return;
    modalTitle.textContent = "СИСТЕМА ПОДАЧИ ОБРАЩЕНИЙ И ФОРМ // DEINOPIDAE";

    var isAuth = !!localStorage.getItem("dnp_active_user");
    var token = localStorage.getItem("dnp_auth_token");
    var authNotice = isAuth ? '' : '<div style="padding: 8px 12px; background: rgba(169,100,104,0.15); border: 1px solid var(--danger); font-size: 11.5px; color: #ff8589;">ВНИМАНИЕ: Для отправки формы необходимо войти в Личный кабинет.</div>';

    modalBody.innerHTML = [
      authNotice,
      '<div style="display: flex; flex-direction: column; gap: 10px;">',
      '  <label style="font-size: 11px; color: var(--cyan);">ВЫБЕРИТЕ КАТЕГОРИЮ:</label>',
      '  <select id="modal-form-type" class="dnp-select">',
      '    <option value="Обращение к руководству">1. Обращение к руководству</option>',
      '    <option value="Жалоба">2. Жалоба</option>',
      '    <option value="Изменение устава">3. Изменение устава</option>',
      '  </select>',
      '  <div id="modal-dynamic-fields" style="display: flex; flex-direction: column; gap: 10px;"></div>',
      '  <label style="font-size: 11px; color: var(--cyan); margin-top: 4px;">ССЫЛКИ НА ДОКАЗАТЕЛЬСТВА (Диск, Imgur, Yapx и др.):</label>',
      '  <textarea id="modal-form-links" class="dnp-textarea" rows="2" placeholder="Вставьте ссылки..."></textarea>',
      '  <label style="font-size: 11px; color: var(--cyan); margin-top: 4px;">ПРИКРЕПИТЬ ФАЙЛЫ / ФОТО (ДО 10 ШТУК):</label>',
      '  <input type="file" id="modal-form-files" multiple accept="image/*,.pdf,.txt,.doc,.docx" style="color: var(--muted); font-size: 11px;">',
      '  <div id="modal-files-count" style="font-size: 11px; color: var(--muted);">Файлов выбрано: 0 / 10</div>',
      '  <button type="button" class="dnp-action" id="modal-form-submit" style="margin: 8px 0 0; align-self: flex-start;">ОТПРАВИТЬ ФОРМУ ↗</button>',
      '  <div id="modal-form-status" style="font-size: 11.5px; margin-top: 4px; font-weight: 700;"></div>',
      '</div>'
    ].join('');

    var typeSelect = document.getElementById("modal-form-type");
    var dynBox = document.getElementById("modal-dynamic-fields");
    var filesInput = document.getElementById("modal-form-files");
    var filesCount = document.getElementById("modal-files-count");

    function renderFields() {
      var val = typeSelect.value;
      if (val === "Обращение к руководству") {
        dynBox.innerHTML = [
          '<label style="font-size: 11px; color: var(--cyan);">1. СУТЬ ОБРАЩЕНИЯ:</label>',
          '<textarea id="field-desc" class="dnp-textarea" rows="4" placeholder="Изложите суть обращения к руководству..."></textarea>'
        ].join('');
      } else if (val === "Жалоба") {
        dynBox.innerHTML = [
          '<label style="font-size: 11px; color: var(--cyan);">1. СУТЬ ЖАЛОБЫ:</label>',
          '<textarea id="field-desc" class="dnp-textarea" rows="3" placeholder="Опишите подробности нарушения..."></textarea>',
          '<label style="font-size: 11px; color: var(--cyan);">2. НИКНЕЙМ НА КОГО ЖАЛУЕТЕСЬ:</label>',
          '<input type="text" id="field-target" class="dnp-input" placeholder="Игровой никнейм нарушителя">'
        ].join('');
      } else if (val === "Изменение устава") {
        dynBox.innerHTML = [
          '<label style="font-size: 11px; color: var(--cyan);">1. ЧТО ИЗМЕНИТЬ:</label>',
          '<textarea id="field-desc" class="dnp-textarea" rows="3" placeholder="Что конкретно предлагается изменить..."></textarea>',
          '<label style="font-size: 11px; color: var(--cyan);">2. КАКИЕ ПУНКТЫ УСТАВА:</label>',
          '<input type="text" id="field-points" class="dnp-input" placeholder="Например: Раздел 2.2, пункт 4">'
        ].join('');
      }
    }

    typeSelect.addEventListener("change", renderFields);
    renderFields();

    filesInput.addEventListener("change", function () {
      if (filesInput.files.length > 10) {
        alert("Максимальное количество прикрепляемых файлов — 10.");
        filesInput.value = "";
        filesCount.textContent = "Файлов выбрано: 0 / 10";
        return;
      }
      filesCount.textContent = "Файлов выбрано: " + filesInput.files.length + " / 10";
    });

    document.getElementById("modal-form-submit").addEventListener("click", function () {
      var statusBox = document.getElementById("modal-form-status");
      if (!isAuth || !token) {
        statusBox.style.color = "var(--danger-bright)";
        statusBox.textContent = "[ОТКАЗ] Отправка форм заблокирована без авторизации.";
        return;
      }

      var descEl = document.getElementById("field-desc");
      var desc = descEl ? descEl.value.trim() : "";
      var links = document.getElementById("modal-form-links").value.trim();
      var targetEl = document.getElementById("field-target");
      var pointsEl = document.getElementById("field-points");
      var targetUser = targetEl ? targetEl.value.trim() : "";
      var rulesPoints = pointsEl ? pointsEl.value.trim() : "";

      if (!desc) {
        statusBox.style.color = "var(--danger-bright)";
        statusBox.textContent = "[ОШИБКА] Заполните описание сути формы.";
        return;
      }

      statusBox.style.color = "var(--cyan)";
      statusBox.textContent = "[SYS] Подготовка и отправка...";

      var rawFiles = filesInput.files ? Array.from(filesInput.files) : [];
      readFilesAsBase64(rawFiles).then(function (encodedFiles) {
        var validFiles = (encodedFiles || []).filter(function (f) { return f !== null; });

        fetch(SERVER_URL + "/api/forms/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({
            token: token,
            type: typeSelect.value,
            description: desc,
            targetUser: targetUser,
            rulesPoints: rulesPoints,
            links: links,
            files: validFiles
          })
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data.success) {
              statusBox.style.color = "var(--ok)";
              statusBox.textContent = "[УСПЕХ] Заявка " + data.reportId + " зарегистрирована!";
              if (descEl) descEl.value = "";
              if (targetEl) targetEl.value = "";
              if (pointsEl) pointsEl.value = "";
              document.getElementById("modal-form-links").value = "";
              filesInput.value = "";
              filesCount.textContent = "Файлов выбрано: 0 / 10";
              loadTicketsScreenData();
            } else {
              statusBox.style.color = "var(--danger-bright)";
              statusBox.textContent = "[ОШИБКА] " + (data.error || "Не удалось отправить");
            }
          })
          .catch(function () {
            statusBox.style.color = "var(--danger-bright)";
            statusBox.textContent = "[СБОЙ СЕТИ] Ошибка соединения.";
          });
      });
    });

    modalBackdrop.style.display = "flex";
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

    if (first === "FORMS") {
      var isGui = parts.some(function (p) { return p.toLowerCase() === "-gui"; });
      if (isGui) {
        showFormsGui();
        printLine("[SYS] Графический интерфейс подачи форм активирован.");
        return;
      }
      printLine("=== [СИСТЕМА ПОДАЧИ ФОРМ И ОБРАЩЕНИЙ] ===");
      printLine("Для вызова графического окна: FORMS -gui");
      return;
    }

    if (first === "HELP") {
      printLine("HELP                - Вызов списка команд");
      printLine("STAFF &lt;никнейм&gt;     - Личное дело сотрудника (флаг -gui для графики)");
      printLine("FIND \"фраза\"        - Поиск данных");
      printLine("FORMS               - Подача форм и рапортов (флаг -gui для графики)");
      printLine("CLS / CLEAR         - Очистить терминал");
      return;
    }

    if (first === "STAFF") {
      var isGuiStaff = parts.some(function (p) { return p.toLowerCase() === "-gui"; });
      var cleanParts = parts.filter(function (p) { return p.toLowerCase() !== "-gui"; });
      var nick = (cleanParts[1] || "").replace(/^"|"$/g, "").toLowerCase();

      if (!nick) {
        printLine("Синтаксис: STAFF &lt;никнейм&gt; или STAFF &lt;никнейм&gt; -gui");
        return;
      }

      var db = window.employeeDb || {};
      var p = db[nick];

      if (p) {
        if (isGuiStaff) {
          var backdrop = document.createElement("div");
          backdrop.className = "dnp-dossier-backdrop";
          backdrop.innerHTML = [
            '<div class="dnp-dossier-paper">',
            '  <button type="button" class="dnp-dossier-close" id="close-dossier-btn">✕</button>',
            '  <div class="dossier-stamp-classified">SECTOR S.E. // CONFIDENTIAL</div>',
            '  <div class="dossier-header">',
            '    <span class="dossier-header-sub">ЛИЧНОЕ ДЕЛО СОТРУДНИКА // COMPLEX DEINOPIDAE</span>',
            '    <h2>' + p.name + '</h2>',
            '  </div>',
            '  <div class="dossier-grid">',
            '    <div class="dossier-photo-col">',
            '      <div class="dossier-avatar-circle">',
            '        <img src="assets/image/favicon.png" alt="Avatar">',
            '      </div>',
            '      <div class="dossier-activity-badge is-active">В АКТИВЕ</div>',
            '    </div>',
            '    <div class="dossier-rows">',
            '      <div class="dossier-row"><span>Звание / Ранг</span><b>' + p.title + ' [' + p.rank + ']</b></div>',
            '      <div class="dossier-row"><span>Норматив МП/Часы</span><b>' + p.mp + ' МП / ' + p.hours + ' ч.</b></div>',
            '      <div class="dossier-row"><span>Статус нормы</span><b>' + p.quota_status + '</b></div>',
            '      <div class="dossier-row"><span>Повышение</span><b>' + p.promotion + '</b></div>',
            '      <div class="dossier-row"><span>Отпуск</span><b>' + p.vacation + '</b></div>',
            '      <div class="dossier-row"><span>Дисциплина</span><b>' + p.penalties + '</b></div>',
            '      <div class="dossier-row"><span>Хихикойны / Баллы</span><b>' + p.coins + ' / ' + p.activity + ' PTS</b></div>',
            '    </div>',
            '  </div>',
            '</div>'
          ].join('');

          document.body.appendChild(backdrop);
          backdrop.querySelector("#close-dossier-btn").addEventListener("click", function () { backdrop.remove(); });
          backdrop.addEventListener("click", function (e) { if (e.target === backdrop) backdrop.remove(); });
        } else {
          printLine("ПОЗЫВНОЙ / НИК    : " + p.name);
          printLine("ЗВАНИЕ / РАНГ     : " + p.title + " [" + p.rank + "]");
          printLine("НОРМАТИВ          : МП: " + p.mp + " | Часы: " + p.hours + " | Оборудование: " + p.equipment);
          printLine("СТАТУС НОРМЫ      : " + p.quota_status);
          printLine("ПОВЫШЕНИЕ         : " + p.promotion);
          printLine("ОТПУСК            : " + p.vacation);
          if (p.lectures) printLine("ЛЕКЦИИ            : ПО: " + p.lectures.po + " | СО: " + p.lectures.so + " | МП: " + p.lectures.mp);
          if (p.exams) printLine("ПРОВЕРКИ          : C: " + p.exams.c + " | B: " + p.exams.b + " | A: " + p.exams.a);
          printLine("НАКАЗАНИЯ         : " + p.penalties);
          printLine("АКТИВ / КОЙНЫ     : Хихикойны: " + p.coins + " | Очки активности: " + p.activity);
        }
      } else {
        printLine("Позывной '" + nick + "' не найден в локальном реестре.");
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
        var rawStr = (emp.name + " " + emp.rank + " " + (emp.title || "") + " " + (emp.penalties || "")).toLowerCase();
        if (rawStr.indexOf(query) !== -1) {
          matches.push("[СОСТАВ] " + emp.name + " // " + emp.title + " [" + emp.rank + "] - Норма: " + emp.quota_status);
        }
      });

      if (matches.length > 0) {
        matches.forEach(function (m) { printLine("  • " + m); });
        printLine("Найдено записей: " + matches.length);
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

    printLine('Команда "' + cmd + '" не распознана. Введите "HELP" для списка команд.');
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