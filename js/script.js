(function () {
  // === 1. ЗАГРУЗЧИК В СТИЛЕ ENDFIELD ===
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

  // === 2. ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ ===
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
          newContent.style.animation = "none";
          void newContent.offsetWidth;
          newContent.style.animation = "";
        }

        buttons.forEach(function (button) {
          var isActive = button.getAttribute("data-screen") === name;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-selected", isActive ? "true" : "false");
        });

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

  // === 3. КОРНИ: ПАРАЛЛАКС ИЗОБРАЖЕНИЯ И ТЕКСТА ПО МЫШИ ===
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
  // 4. ИНДЕКС УНИВЕРСАЛЬНОГО ПОИСКА КПК
  // =========================================================
  var searchIndex = [
    // РАЗДЕЛ 1: ОСНОВА
    {
      title: "Раздел 1 — Основа",
      subtitle: "О предприятии Deinopidae, цели, задачи комплекса",
      badge: "УСТАВ",
      keywords: ["основа", "предприятие", "дейнопидае", "задачи", "мерчендайзер", "цели", "поставки", "починка", "арахна"],
      type: "internal",
      target: "ustav-01"
    },
    {
      title: "БРУД // Раздел 1 — Основа",
      subtitle: "Официальный регламент предприятия в БРУД",
      badge: "БРУД // DOC",
      keywords: ["основа", "бруд", "документ", "профиль", "предприятие"],
      type: "external",
      url: "https://docs.google.com/document/d/BURD_OSNOVA_DOC_ID/edit#heading=h.section1"
    },

    // РАЗДЕЛ 2: ПРАВИЛА
    {
      title: "Раздел 2 — Правила",
      subtitle: "Основной перечень правил, КВР, виды наказаний",
      badge: "УСТАВ",
      keywords: ["правила", "квр", "закон", "discord", "наказания", "устный", "икоку", "кенсэки", "увольнение"],
      type: "internal",
      target: "ustav-02"
    },
    {
      title: "БРУД // Раздел 2 — Правила",
      subtitle: "Развёрнутый свод законов и штрафных санкций в БРУД",
      badge: "БРУД // DOC",
      keywords: ["правила", "бруд", "наказания", "санкции", "икоку", "кенсэки"],
      type: "external",
      url: "https://docs.google.com/document/d/BURD_RULES_DOC_ID/edit#heading=h.section2"
    },

    // РАЗДЕЛ 3: ПОВЫШЕНИЯ И НОРМА
    {
      title: "Раздел 3 — Повышения и норма",
      subtitle: "Еженедельная норма по рангам, звания (Курсант - Главный инженер)",
      badge: "УСТАВ",
      keywords: ["норма", "повышение", "часы", "квесты", "курсант", "локализатор", "оператор", "диспетчер", "эксперт", "инспектор", "конструктор", "инженер", "потолок", "отписка-нормы"],
      type: "internal",
      target: "ustav-03"
    },
    {
      title: "БРУД // Раздел 3 — Повышения и норма",
      subtitle: "Регламент сдачи нормы, отписок и подачи отчётов на звания",
      badge: "БРУД // DOC",
      keywords: ["норма", "повышения", "бруд", "звания", "отписка", "кэнсюсей", "сэнкосэй", "тюсэй", "дзёсэй"],
      type: "external",
      url: "https://docs.google.com/document/d/BURD_PROMOTIONS_DOC_ID/edit#heading=h.section3"
    },

    // РАЗДЕЛ 4: ПРОВЕРКИ И ЛЕКЦИИ
    {
      title: "Раздел 4 — Проверки и Лекции",
      subtitle: "Проверки C/B/A, лекции ПО, СО, МП, регламент пинга офицера",
      badge: "УСТАВ",
      keywords: ["проверки", "лекции", "экзамен", "тест", "по", "со", "мп", "офицер", "гч", "база", "реактор"],
      type: "internal",
      target: "ustav-04"
    },
    {
      title: "БРУД // Раздел 4 — Проверки и Лекции",
      subtitle: "Материалы для сдачи экзаменов и билеты лекций",
      badge: "БРУД // DOC",
      keywords: ["проверки", "лекции", "билеты", "бруд", "материалы", "экзамен"],
      type: "external",
      url: "https://docs.google.com/document/d/BURD_EXAMS_DOC_ID/edit#heading=h.section4"
    },

    // РАЗДЕЛ 5: АКТИВНОСТИ
    {
      title: "Раздел 5 — Активности",
      subtitle: "Уровни активности 0/1/2, шкала прогрессии, правила сгорания",
      badge: "УСТАВ",
      keywords: ["активность", "активности", "баллы", "очки", "шкала", "уровень", "сброс", "понедельник", "pts"],
      type: "internal",
      target: "ustav-05"
    },
    {
      title: "БРУД // Раздел 5 — Активности",
      subtitle: "Регламент начисления очков активности и премирования",
      badge: "БРУД // DOC",
      keywords: ["активности", "очки", "бруд", "рейтинг", "премии"],
      type: "external",
      url: "https://docs.google.com/document/d/BURD_ACTIVITIES_DOC_ID/edit#heading=h.section5"
    },

    // РАЗДЕЛ 6: ПРОЧЕЕ
    {
      title: "Раздел 6 — Прочее",
      subtitle: "Проведение мероприятий (5 и 7 звания)",
      badge: "УСТАВ",
      keywords: ["прочее", "мероприятия", "мп", "надзор", "полевой", "ведущий"],
      type: "internal",
      target: "ustav-06"
    },
    {
      title: "БРУД // Раздел 6 — Прочее",
      subtitle: "Дополнительные протоколы проведения мероприятий",
      badge: "БРУД // DOC",
      keywords: ["прочее", "мероприятия", "бруд", "регламент"],
      type: "external",
      url: "https://docs.google.com/document/d/BURD_MISC_DOC_ID/edit#heading=h.section6"
    },

    // РАЗДЕЛ 7: КОНЕЦ
    {
      title: "Раздел 7 — Конец",
      subtitle: "Заключение, авторы и первоиздатели устава",
      badge: "УСТАВ",
      keywords: ["конец", "заключение", "wewewewestrelok", "egorik0130", "редактор", "дата"],
      type: "internal",
      target: "ustav-07"
    },
    {
      title: "БРУД // Раздел 7 — Конец",
      subtitle: "Юридический архив утверждения документов в БРУД",
      badge: "БРУД // DOC",
      keywords: ["конец", "бруд", "архив"],
      type: "external",
      url: "https://docs.google.com/document/d/BURD_FINAL_DOC_ID/edit#heading=h.section7"
    },

    // ДОКУМЕНТЫ
    {
      title: "Таблица личного состава и нормы",
      subtitle: "Google Таблица: часы, звания, выговоры и состав отдела",
      badge: "GOOGLE SHEETS",
      keywords: ["таблица", "таблицу", "состав", "реестр", "часы", "выговоры", "список"],
      type: "external",
      url: "https://docs.google.com/spreadsheets/d/1IHAdgvHB27iW4s9aJe4L0GIpYrhS_R2EonUwugZIJww/edit?gid=601978163#gid=601978163"
    },
    {
      title: "Внеурочки: Отдел починки (ПО)",
      subtitle: "Google Документ: форма и требования к отчетам починки",
      badge: "GOOGLE DOCS",
      keywords: ["внеурочки", "по", "починка", "отчет", "форма"],
      type: "external",
      url: "https://docs.google.com/document/d/1uE71cTVHOE3EuCvhobRR2kRhBRD6_jkZpuRtHyttJss/edit?tab=t.3eryletig9pf"
    },
    {
      title: "Внеурочки: Отдел создания (СО)",
      subtitle: "Google Документ: форма и требования к отчетам создания",
      badge: "GOOGLE DOCS",
      keywords: ["внеурочки", "со", "создание", "отчет", "форма"],
      type: "external",
      url: "https://docs.google.com/document/d/1uE71cTVHOE3EuCvhobRR2kRhBRD6_jkZpuRtHyttJss/edit?tab=t.dbweaooy075n"
    },
    {
      title: "Пользовательское соглашение",
      subtitle: "Google Документ: условия и регламент эксплуатации систем",
      badge: "GOOGLE DOCS",
      keywords: ["пользовательское", "соглашение", "условия", "регламент"],
      type: "external",
      url: "https://docs.google.com/document/d/19s4BciaStHnKUGiKVbS0_ZXwLyneFtL_1h7jKW1yjQc/edit?tab=t.3eryletig9pf"
    },
    {
      title: "Справочник сотрудника",
      subtitle: "Google Документ: базовый справочный материал департамента S.E.",
      badge: "GOOGLE DOCS",
      keywords: ["справочник", "справки", "информация", "база", "се"],
      type: "external",
      url: "https://docs.google.com/document/d/1tyOYPDDdCkR05MErbYVRTcsnkziUA5bxzr5-_I7G6Pk/edit?tab=t.3eryletig9pf"
    }
  ];

  // === 5. ЛОГИКА ЖИВОГО ПОИСКА БЕЗ КАТЕГОРИЙ И ПОДСКАЗОК ===
  var searchInput = document.getElementById("dnp-db-search");
  var searchClear = document.getElementById("dnp-search-clear");
  var searchResults = document.getElementById("dnp-search-results");

  if (searchInput && searchResults) {
    function runSearch() {
      var query = searchInput.value.trim().toLowerCase();

      if (searchClear) {
        searchClear.style.display = query.length > 0 ? "block" : "none";
      }

      if (query.length === 0) {
        searchResults.innerHTML = "";
        return;
      }

      var filtered = searchIndex.filter(function (item) {
        var matchTitle = item.title.toLowerCase().indexOf(query) !== -1;
        var matchSub = item.subtitle.toLowerCase().indexOf(query) !== -1;
        var matchKeys = item.keywords.some(function (k) {
          return k.indexOf(query) !== -1;
        });

        return matchTitle || matchSub || matchKeys;
      });

      if (filtered.length === 0) {
        searchResults.innerHTML = '<div style="padding: 10px 14px; color: var(--muted); font-size: 12px; border: 1px dashed rgba(138,160,168,0.2);">Совпадений не найдено</div>';
        return;
      }

      var html = "";
      filtered.forEach(function (res, index) {
        var extraClass = "";
        if (res.badge.indexOf("БРУД") !== -1) extraClass = "is-brud";
        if (res.badge.indexOf("GOOGLE") !== -1) extraClass = "is-doc";

        // Задержка анимации для каскадного выезда
        var delay = (index * 0.03).toFixed(2);

        html += '<div class="dnp-search-item ' + extraClass + '" style="animation-delay: ' + delay + 's;" data-type="' + res.type + '" data-target="' + (res.target || '') + '" data-url="' + (res.url || '') + '">';
        html += '  <div class="dnp-search-item-info">';
        html += '    <b>' + res.title + '</b>';
        html += '    <span>' + res.subtitle + '</span>';
        html += '  </div>';
        html += '  <div class="dnp-search-item-badge">' + res.badge + '</div>';
        html += '</div>';
      });

      searchResults.innerHTML = html;
    }

    searchInput.addEventListener("input", runSearch);

    if (searchClear) {
      searchClear.addEventListener("click", function () {
        searchInput.value = "";
        runSearch();
        searchInput.focus();
      });
    }

    searchResults.addEventListener("click", function (e) {
      var item = e.target.closest(".dnp-search-item");
      if (!item) return;

      var type = item.getAttribute("data-type");
      if (type === "internal") {
        var screenTarget = item.getAttribute("data-target");
        if (screenTarget) {
          openScreen(screenTarget);
        }
      } else if (type === "external") {
        var url = item.getAttribute("data-url");
        if (url) {
          window.open(url, "_blank");
        }
      }
    });
  }

  // =========================================================
  // 6. РЕЕСТР СОСТАВА (С КАРТИНКОЙ СТАФФА)
  // =========================================================
  var employeeInput = document.getElementById("dnp-employee-input");
  var employeeBtn = document.getElementById("dnp-employee-btn");
  var employeeCard = document.getElementById("dnp-employee-card");

  var employeeDatabase = {
    "xxartemrtxxx": { name: "xxartemrtxxx", rank: "OFFICER", role: "Офицер отдела", hours: "18 ч.", po: 6, so: 4, ikoku: 0, kenseki: 0, status: "АКТИВЕН // В СТРОЮ" },
    "egorik0130": { name: "EGORIK0130", rank: "OFFICER", role: "Офицер отдела", hours: "24 ч.", po: 8, so: 5, ikoku: 0, kenseki: 0, status: "АКТИВЕН // В СТРОЮ" },
    "ceretow2222": { name: "ceretow2222", rank: "PROFESSOR", role: "Профессор", hours: "14 ч.", po: 4, so: 3, ikoku: 0, kenseki: 0, status: "АКТИВЕН // В СТРОЮ" },
    "zzmalf4": { name: "zzmalf4", rank: "PROFESSOR", role: "Профессор", hours: "16 ч.", po: 5, so: 2, ikoku: 0, kenseki: 0, status: "АКТИВЕН // В СТРОЮ" },
    "wewewewestrelok": { name: "Wewewewestrelok", rank: "OFFICER", role: "Первоиздатель", hours: "—", po: "—", so: "—", ikoku: 0, kenseki: 0, status: "АРХИВ // ПОЧЁТНЫЙ" },
    "kira_ewika": { name: "kira_ewika", rank: "PROFESSOR", role: "Экс-профессор", hours: "—", po: "—", so: "—", ikoku: 1, kenseki: 0, status: "АРХИВ" }
  };

  function lookupEmployee() {
    if (!employeeInput || !employeeCard) return;
    var query = employeeInput.value.trim().toLowerCase();

    if (!query) {
      employeeCard.innerHTML = '<span class="dnp-muted">Введите позывной для выгрузки дела из реестра комплекса.</span>';
      return;
    }

    var record = employeeDatabase[query];

    if (record) {
      employeeCard.innerHTML = [
        '<div class="dnp-dossier">',
        '  <div class="dnp-dossier-avatar">',
        '    <img src="assets/image/favicon.png" alt="Emblem">',
        '  </div>',
        '  <div class="dnp-dossier-grid">',
        '    <div class="dnp-dossier-cell"><span>ПОЗЫВНОЙ // НИК</span><b>' + record.name + '</b></div>',
        '    <div class="dnp-dossier-cell"><span>ТЕКУЩЕЕ ЗВАНИЕ</span><b>' + record.rank + ' (' + record.role + ')</b></div>',
        '    <div class="dnp-dossier-cell"><span>ОТЫГРАНО ЧАСОВ</span><b>' + record.hours + '</b></div>',
        '    <div class="dnp-dossier-cell"><span>СДАНО ПО / СО</span><b>' + record.po + ' ПО / ' + record.so + ' СО</b></div>',
        '    <div class="dnp-dossier-cell"><span>ИКОКУ / КЕНСЭКИ</span><b style="color:' + (record.kenseki > 0 ? 'var(--danger)' : 'var(--text)') + ';">' + record.ikoku + ' ИК. / ' + record.kenseki + ' КЕН.</b></div>',
        '    <div class="dnp-dossier-cell"><span>СТАТУС ДОПУСКА</span><b class="dnp-ok">' + record.status + '</b></div>',
        '  </div>',
        '</div>'
      ].join('');
    } else {
      employeeCard.innerHTML = [
        '<div class="dnp-dossier">',
        '  <div class="dnp-dossier-avatar">',
        '    <img src="assets/image/favicon.png" alt="Emblem">',
        '  </div>',
        '  <div class="dnp-dossier-grid">',
        '    <div class="dnp-dossier-cell"><span>ПОЗЫВНОЙ // НИК</span><b>' + employeeInput.value + '</b></div>',
        '    <div class="dnp-dossier-cell"><span>СТАТУС В БАЗЕ</span><b class="dnp-warn-text">СИНХРОНИЗАЦИЯ С ТАБЛИЦЕЙ</b></div>',
        '    <div class="dnp-dossier-cell" style="grid-column: 1 / -1;"><span class="dnp-muted">Сотрудник найден в общей ведомости:</span><a class="dnp-action" style="margin: 6px 0 0;" target="_blank" href="https://docs.google.com/spreadsheets/d/1IHAdgvHB27iW4s9aJe4L0GIpYrhS_R2EonUwugZIJww/edit?gid=601978163#gid=601978163">ОТКРЫТЬ В ТАБЛИЦЕ COMPLEX</a></div>',
        '  </div>',
        '</div>'
      ].join('');
    }
  }

  if (employeeBtn) {
    employeeBtn.addEventListener("click", lookupEmployee);
  }
  if (employeeInput) {
    employeeInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") lookupEmployee();
    });
  }
})();