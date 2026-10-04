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
  // ТЕРМИНАЛ И ФОРМЫ
  // =========================================================
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

  var envVars = {
    "OS": "Deinopidae Terminal OS [Build 2026.4]",
    "DRIVE": "D:\\",
    "SYSTEM_NODE": "DEINOPIDAE S.E. // CORE",
    "TERMINAL_STATUS": "ACTIVE"
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
          '  <span class="dnp-user-name">' + (u.username || 'OPERATOR') + '</span>',
          '</div>',
          '<div class="dnp-user-dropdown" id="dnp-user-dropdown" style="display: none;">',
          '  <div class="dnp-dropdown-item" id="dnp-menu-profile">Профиль (' + (u.roblox || 'N/A') + ')</div>',
          '  <div class="dnp-dropdown-item" id="dnp-menu-settings">Настройки</div>',
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

        document.getElementById("dnp-menu-logout").addEventListener("click", function() {
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
        if (input) {
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

  // МОДАЛЬНОЕ ОКНО GUI
  var modalBackdrop = document.getElementById("dnp-gui-modal");
  var modalTitle = document.getElementById("dnp-modal-title");
  var modalBody = document.getElementById("dnp-modal-body");
  var modalClose = document.getElementById("dnp-modal-close-btn");

  if (modalClose && modalBackdrop) {
    modalClose.addEventListener("click", function() {
      modalBackdrop.style.display = "none";
    });
    modalBackdrop.addEventListener("click", function(e) {
      if (e.target === modalBackdrop) modalBackdrop.style.display = "none";
    });
  }

  function readFilesAsBase64(fileList) {
    var promises = [];
    for (var i = 0; i < fileList.length; i++) {
      (function(file) {
        promises.push(new Promise(function(resolve) {
          var reader = new FileReader();
          reader.onload = function(e) {
            resolve({
              name: file.name,
              type: file.type,
              data: e.target.result
            });
          };
          reader.onerror = function() { resolve(null); };
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
    var authNotice = isAuth ? '' : '<div style="padding: 8px 12px; background: rgba(169,100,104,0.15); border: 1px solid var(--danger); font-size: 11.5px; color: #ff8589;">ВНИМАНИЕ: Для отправки формы необходимо войти в Личный кабинет. <a href="auth.html" style="text-decoration: underline; color: #fff; margin-left: 6px;">АВТОРИЗАЦИЯ ↗</a></div>';

    modalBody.innerHTML = [
      authNotice,
      '<div style="display: flex; flex-direction: column; gap: 10px;">',
      '  <label style="font-size: 11px; color: var(--line);">ВЫБЕРИТЕ КАТЕГОРИЮ:</label>',
      '  <select id="modal-form-type" style="background: var(--panel-2); border: 1px solid var(--line); color: #fff; padding: 8px 10px; font-family: \'Roboto Mono\', monospace;">',
      '    <option value="Обращение к руководству">1. Обращение к руководству</option>',
      '    <option value="Жалоба">2. Жалоба</option>',
      '    <option value="Изменение устава">3. Изменение устава</option>',
      '  </select>',
      '  <div id="modal-dynamic-fields" style="display: flex; flex-direction: column; gap: 10px;"></div>',
      '  <label style="font-size: 11px; color: var(--line); margin-top: 4px;">ССЫЛКИ НА ДОКАЗАТЕЛЬСТВА (Диск, Imgur, Yapx и др.):</label>',
      '  <textarea id="modal-form-links" rows="2" placeholder="Вставьте ссылки (каждая с новой строки)..." style="background: var(--panel-2); border: 1px solid var(--line); color: #fff; padding: 8px 10px; font-family: \'Roboto Mono\', monospace;"></textarea>',
      '  <label style="font-size: 11px; color: var(--line); margin-top: 4px;">ПРИКРЕПИТЬ ФАЙЛЫ / ФОТО (ДО 10 ШТУК):</label>',
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
          '<label style="font-size: 11px; color: var(--line);">1. СУТЬ ОБРАЩЕНИЯ:</label>',
          '<textarea id="field-desc" rows="4" placeholder="Изложите суть обращения к руководству..." style="background: var(--panel-2); border: 1px solid var(--line); color: #fff; padding: 8px 10px; font-family: \'Roboto Mono\', monospace;"></textarea>'
        ].join('');
      } else if (val === "Жалоба") {
        dynBox.innerHTML = [
          '<label style="font-size: 11px; color: var(--line);">1. СУТЬ ЖАЛОБЫ:</label>',
          '<textarea id="field-desc" rows="3" placeholder="Опишите подробности нарушения..." style="background: var(--panel-2); border: 1px solid var(--line); color: #fff; padding: 8px 10px; font-family: \'Roboto Mono\', monospace;"></textarea>',
          '<label style="font-size: 11px; color: var(--line);">2. НИКНЕЙМ НА КОГО ЖАЛУЕТЕСЬ:</label>',
          '<input type="text" id="field-target" placeholder="Игровой никнейм нарушителя" style="background: var(--panel-2); border: 1px solid var(--line); color: #fff; padding: 8px 10px; font-family: \'Roboto Mono\', monospace;">'
        ].join('');
      } else if (val === "Изменение устава") {
        dynBox.innerHTML = [
          '<label style="font-size: 11px; color: var(--line);">1. ЧТО ИЗМЕНИТЬ:</label>',
          '<textarea id="field-desc" rows="3" placeholder="Что конкретно предлагается изменить..." style="background: var(--panel-2); border: 1px solid var(--line); color: #fff; padding: 8px 10px; font-family: \'Roboto Mono\', monospace;"></textarea>',
          '<label style="font-size: 11px; color: var(--line);">2. КАКИЕ ПУНКТЫ УСТАВА:</label>',
          '<input type="text" id="field-points" placeholder="Например: Раздел 2.2, пункт 4" style="background: var(--panel-2); border: 1px solid var(--line); color: #fff; padding: 8px 10px; font-family: \'Roboto Mono\', monospace;">'
        ].join('');
      }
    }

    typeSelect.addEventListener("change", renderFields);
    renderFields();

    filesInput.addEventListener("change", function() {
      if (filesInput.files.length > 10) {
        alert("Максимальное количество прикрепляемых файлов — 10.");
        filesInput.value = "";
        filesCount.textContent = "Файлов выбрано: 0 / 10";
        return;
      }
      filesCount.textContent = "Файлов выбрано: " + filesInput.files.length + " / 10";
    });

    document.getElementById("modal-form-submit").addEventListener("click", function() {
      var statusBox = document.getElementById("modal-form-status");
      if (!isAuth || !token) {
        statusBox.style.color = "var(--danger)";
        statusBox.textContent = "[ОТКАЗ] Отправка форм заблокирована без авторизации в Личном кабинете.";
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
        statusBox.style.color = "var(--danger)";
        statusBox.textContent = "[ОШИБКА] Заполните описание сути формы.";
        return;
      }

      statusBox.style.color = "var(--line)";
      statusBox.textContent = "[SYS] Подготовка и загрузка файлов...";

      var rawFiles = filesInput.files ? Array.from(filesInput.files) : [];
      readFilesAsBase64(rawFiles).then(function(encodedFiles) {
        var validFiles = (encodedFiles || []).filter(function(f) { return f !== null; });

        statusBox.textContent = "[SYS] Передача формы на сервер...";

        fetch("https://deinopidae-api.onrender.com/api/forms/submit", {
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
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.success) {
            statusBox.style.color = "var(--ok)";
            statusBox.textContent = "[УСПЕХ] Заявка " + data.reportId + " зарегистрирована и передана в Discord!";
            if (descEl) descEl.value = "";
            if (targetEl) targetEl.value = "";
            if (pointsEl) pointsEl.value = "";
            document.getElementById("modal-form-links").value = "";
            filesInput.value = "";
            filesCount.textContent = "Файлов выбрано: 0 / 10";
          } else {
            statusBox.style.color = "var(--danger)";
            statusBox.textContent = "[ОШИБКА] " + (data.error || "Не удалось отправить");
          }
        })
        .catch(function() {
          statusBox.style.color = "var(--danger)";
          statusBox.textContent = "[СБОЙ СЕТИ] Ошибка соединения с сервером.";
        });
      });
    });

    modalBackdrop.style.display = "flex";
  }

  function sendTextForm(type, desc, extraField, links) {
    var token = localStorage.getItem("dnp_auth_token");
    if (!token) {
      printLine("<span style='color:var(--danger);'>[ОТКАЗ] Отправка форм доступна только авторизованным сотрудникам. Войдите в Личный кабинет.</span>");
      return;
    }

    var payload = {
      token: token,
      type: type,
      description: desc,
      links: links || 'Отсутствуют',
      files: []
    };

    if (type === "Жалоба") {
      payload.targetUser = extraField || "Не указан";
    } else if (type === "Изменение устава") {
      payload.rulesPoints = extraField || "Не указаны";
    }

    printLine("<span style='color:var(--line);'>[SYS] Отправка формы [" + type + "]...</span>");

    fetch("https://deinopidae-api.onrender.com/api/forms/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        printLine("<span style='color:var(--ok);'>[УСПЕХ] Заявка [" + type + "] " + data.reportId + " зарегистрирована и отправлена в Discord!</span>");
      } else {
        printLine("<span style='color:var(--danger);'>[ОШИБКА] " + (data.error || "Сбой отправки") + "</span>");
      }
    })
    .catch(function() {
      printLine("<span style='color:var(--danger);'>[СБОЙ СЕТИ] Сервер недоступен.</span>");
    });
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

    // КОМАНДА FORMS
    if (first === "FORMS") {
      var isGui = parts.some(function(p) { return p.toLowerCase() === "-gui"; });
      if (isGui) {
        showFormsGui();
        printLine("[SYS] Графический интерфейс подачи форм активирован.");
        return;
      }

      var subCmd = (parts[1] || "").toLowerCase();

      if (subCmd === "1" || subCmd === "обращение") {
        var desc1 = (parts[2] || "").replace(/^"|"$/g, "");
        var links1 = (parts[3] || "").replace(/^"|"$/g, "");
        if (!desc1) {
          printLine("Синтаксис: forms 1 \"Суть обращения\" \"Ссылки на файлы (опционально)\"");
          return;
        }
        sendTextForm("Обращение к руководству", desc1, "", links1);
        return;
      }

      if (subCmd === "2" || subCmd === "жалоба") {
        var desc2 = (parts[2] || "").replace(/^"|"$/g, "");
        var target = (parts[3] || "").replace(/^"|"$/g, "");
        var links2 = (parts[4] || "").replace(/^"|"$/g, "");
        if (!desc2 || !target) {
          printLine("Синтаксис: forms 2 \"Суть жалобы\" \"Никнейм нарушителя\" \"Ссылки на доказательства (опционально)\"");
          return;
        }
        sendTextForm("Жалоба", desc2, target, links2);
        return;
      }

      if (subCmd === "3" || subCmd === "устав") {
        var desc3 = (parts[2] || "").replace(/^"|"$/g, "");
        var points = (parts[3] || "").replace(/^"|"$/g, "");
        var links3 = (parts[4] || "").replace(/^"|"$/g, "");
        if (!desc3 || !points) {
          printLine("Синтаксис: forms 3 \"Что изменить\" \"Какие пункты устава\" \"Ссылки / Обоснование (опционально)\"");
          return;
        }
        sendTextForm("Изменение устава", desc3, points, links3);
        return;
      }

      printLine("=== [СИСТЕМА ПОДАЧИ ФОРМ И ОБРАЩЕНИЙ] ===");
      printLine("  [1] Обращение к руководству");
      printLine("      Синтаксис: forms 1 \"Суть обращения\" \"Ссылки на файлы\"");
      printLine("  [2] Жалоба");
      printLine("      Синтаксис: forms 2 \"Суть жалобы\" \"Никнейм нарушителя\" \"Ссылки на доказательства\"");
      printLine("  [3] Изменение устава");
      printLine("      Синтаксис: forms 3 \"Что изменить\" \"Какие пункты\" \"Ссылки/обоснование\"");
      printLine("Для графического окна с загрузкой до 10 файлов введите: FORMS -gui");
      return;
    }

    if (first === "HELP") {
      printLine("HELP                - Вызов списка доступных команд");
      printLine("STAFF &lt;никнейм&gt;     - Личное дело сотрудника (флаг -gui для графики)");
      printLine("FIND \"фраза\"        - Поиск данных");
      printLine("FORMS               - Подача форм и рапортов (флаг -gui для графики)");
      printLine("CLS / CLEAR         - Очистить терминал");
      return;
    }

    // КОМАНДА STAFF (БЕЗ РАМОК ===)
    if (first === "STAFF") {
      var isGuiStaff = parts.some(function(p) { return p.toLowerCase() === "-gui"; });
      var cleanParts = parts.filter(function(p) { return p.toLowerCase() !== "-gui"; });
      var nick = (cleanParts[1] || "").replace(/^"|"$/g, "").toLowerCase();

      if (!nick) {
        printLine("Синтаксис: STAFF &lt;никнейм&gt; или STAFF &lt;никнейм&gt; -gui");
        return;
      }

      var db = window.employeeDb || {};
      var p = db[nick];

      if (p) {
        if (isGuiStaff) {
          var cardHtml = [
            '<div class="dnp-gui-dossier-card">',
            '  <div class="dnp-gui-card-head">',
            '    <b>' + p.name + ' // ДОСЬЕ КОМПЛЕКСА</b>',
            '    <span>' + p.title + ' [' + p.rank + ']</span>',
            '  </div>',
            '  <div class="dnp-gui-card-body">',
            '    <div class="dnp-gui-avatar-box">',
            '      <img src="assets/image/favicon.png" alt="Avatar">',
            '    </div>',
            '    <div class="dnp-gui-stats-grid">',
            '      <div class="dnp-gui-stat-cell"><span>Норматив МП/Часы</span><b>' + p.mp + ' МП / ' + p.hours + ' ч.</b></div>',
            '      <div class="dnp-gui-stat-cell"><span>Статус нормы</span><b>' + p.quota_status + '</b></div>',
            '      <div class="dnp-gui-stat-cell"><span>Повышение</span><b>' + p.promotion + '</b></div>',
            '      <div class="dnp-gui-stat-cell"><span>Отпуск</span><b>' + p.vacation + '</b></div>',
            '      <div class="dnp-gui-stat-cell"><span>Дисциплина</span><b>' + p.penalties + '</b></div>',
            '      <div class="dnp-gui-stat-cell"><span>Хихикойны / Актив</span><b>' + p.coins + ' / ' + p.activity + ' PTS</b></div>',
            '    </div>',
            '  </div>',
            '</div>'
          ].join('');
          printLine(cardHtml);
        } else {
          printLine("ПОЗЫВНОЙ / НИК    : " + p.name);
          printLine("ЗВАНИЕ / РАНГ     : " + p.title + " [" + p.rank + "]");
          printLine("НОРМАТИВ          : МП: " + p.mp + " | Часы: " + p.hours + " | Оборудование: " + p.equipment);
          printLine("СТАТУС НОРМЫ      : " + p.quota_status);
          printLine("ПОВЫШЕНИЕ         : " + p.promotion);
          printLine("ОТПУСК            : " + p.vacation);
          if (p.lectures) {
            printLine("ЛЕКЦИИ            : ПО: " + p.lectures.po + " | СО: " + p.lectures.so + " | МП: " + p.lectures.mp);
          }
          if (p.exams) {
            printLine("ПРОВЕРКИ          : C: " + p.exams.c + " | B: " + p.exams.b + " | A: " + p.exams.a);
          }
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
        matches.forEach(function (m) {
          printLine("  • " + m);
        });
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
})();