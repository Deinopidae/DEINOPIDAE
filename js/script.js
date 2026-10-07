/* =========================================================
   DEINOPIDAE HUD NAVIGATION & TERMINAL CLIENT CONTROLLER
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК УСТАВА И ОСНОВНОГО МЕНЮ
  const subItems = document.querySelectorAll('.sub-item');
  const navItems = document.querySelectorAll('.nav-tree .nav-item[data-tab]');
  const views = document.querySelectorAll('.content-view');
  const ustavGroup = document.getElementById('navGroupUstav');
  const ustavSublist = document.getElementById('ustavSublist');
  const rootUstavItem = document.querySelector('[data-action="toggle-ustav"]');

  function switchTab(targetId) {
    views.forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(targetId);
    if (targetView) targetView.classList.add('active');

    // Если это терминал — фокусируемся на строке ввода
    if (targetId === 'tab-terminal') {
      const input = document.getElementById('termInput');
      if (input) setTimeout(() => input.focus(), 50);
    }
  }

  // Клики по подпунктам Устава
  subItems.forEach(item => {
    item.addEventListener('click', () => {
      subItems.forEach(si => si.classList.remove('active'));
      navItems.forEach(ni => ni.classList.remove('active'));

      item.classList.add('active');
      rootUstavItem.classList.add('active');

      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Клики по верхнеуровневым пунктам (База данных, Корни, Вербовка)
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.classList.contains('locked')) {
        // Показываем заблокированную вербовку
        const tabId = item.getAttribute('data-tab');
        if (tabId) switchTab(tabId);
        return;
      }

      navItems.forEach(ni => ni.classList.remove('active'));
      subItems.forEach(si => si.classList.remove('active'));
      rootUstavItem.classList.remove('active');

      item.classList.add('active');
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Сворачивание / разворачивание Устава
  if (rootUstavItem) {
    rootUstavItem.addEventListener('click', () => {
      if (ustavSublist.style.display === 'none') {
        ustavSublist.style.display = 'block';
        rootUstavItem.querySelector('.nav-status').textContent = 'OPEN';
      } else {
        ustavSublist.style.display = 'none';
        rootUstavItem.querySelector('.nav-status').textContent = 'CLOSED';
      }
    });
  }

  // ================= ТЕРМИНАЛ / БАЗА ДАННЫХ =================
  const termInput = document.getElementById('termInput');
  const termOutput = document.getElementById('terminalOutput');

  if (termInput && termOutput) {
    termInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const cmd = termInput.value.trim();
        if (!cmd) return;

        // Вывод команды в консоль
        printTerminalLine(`D:\\"USER"> ${cmd}`, '#ffffff');
        termInput.value = '';

        await handleTerminalCommand(cmd.toLowerCase());
        termOutput.scrollTop = termOutput.scrollHeight;
      }
    });
  }

  function printTerminalLine(text, color = '#8bb2c2') {
    const div = document.createElement('div');
    div.style.color = color;
    div.style.marginBottom = '4px';
    div.style.fontFamily = 'var(--font-mono)';
    div.textContent = text;
    termOutput.appendChild(div);
  }

  async function handleTerminalCommand(cmd) {
    const parts = cmd.split(' ');
    const action = parts[0];

    if (action === 'help') {
      printTerminalLine('AVAILABLE COMMANDS:', '#00f0ff');
      printTerminalLine('  HELP             - Список всех доступных команд');
      printTerminalLine('  STATUS           - Диагностика системы и ядра PDA');
      printTerminalLine('  STAFF            - Список сотрудников из базы данных');
      printTerminalLine('  USER <никнейм>   - Просмотр досье сотрудника');
      printTerminalLine('  CLEAR            - Очистить экран консоли');
      return;
    }

    if (action === 'clear') {
      termOutput.innerHTML = `
        <div class="term-line-dim">&#9660; LOADING INFORMATION, PRESS LMB TO SKIP</div>
        <div class="term-line-info">&#9654; LOAD COMPLETE, TYPE "HELP" FOR SEE HELP</div>
      `;
      return;
    }

    if (action === 'status') {
      printTerminalLine('SYS DIAGNOSTIC: READY', '#00f0ff');
      printTerminalLine('CLUSTER HOST: DEINOPIDAE S.E. CLOUD');
      printTerminalLine('DB AUTH: ONLINE // DB STAFF: SYNCED');
      return;
    }

    if (action === 'staff') {
      printTerminalLine('Запрос к реестру сотрудников...', '#557280');
      try {
        const res = await fetch('/api/users/data');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const keys = Object.keys(data);
        if (keys.length === 0) {
          printTerminalLine('База данных сотрудников пуста или обновляется.', '#ffaa00');
          return;
        }
        printTerminalLine(`НАЙДЕНО СОТРУДНИКОВ: ${keys.length}`, '#00f0ff');
        keys.slice(0, 15).forEach(k => {
          const emp = data[k];
          printTerminalLine(`• ${emp.name} | [${emp.title}] | Ранг: ${emp.rank}`);
        });
        if (keys.length > 15) {
          printTerminalLine(`...и ещё ${keys.length - 15} сотрудников. Используйте "USER <ник>" для поиска.`);
        }
      } catch (err) {
        printTerminalLine('Ошибка связи с сервером базы данных.', '#ff3344');
      }
      return;
    }

    if (action === 'user') {
      const target = parts.slice(1).join(' ').trim().toLowerCase();
      if (!target) {
        printTerminalLine('Укажите никнейм: USER <никнейм>', '#ffaa00');
        return;
      }
      try {
        const res = await fetch('/api/users/data');
        const data = await res.json();
        const emp = data[target] || Object.values(data).find(e => e.name.toLowerCase() === target);
        if (!emp) {
          printTerminalLine(`Сотрудник "${target}" не найден в реестре.`, '#ff3344');
          return;
        }
        printTerminalLine(`=== ДОСЬЕ: ${emp.name} ===`, '#00f0ff');
        printTerminalLine(`Звание: ${emp.title} (${emp.rank})`);
        printTerminalLine(`Часы: ${emp.hours} | Норма: ${emp.quota_status}`);
        printTerminalLine(`Активность: ${emp.activity} очков`);
        printTerminalLine(`Статус повышения: ${emp.promotion}`);
      } catch (err) {
        printTerminalLine('Ошибка получения досье.', '#ff3344');
      }
      return;
    }

    printTerminalLine(`Неизвестная команда: "${cmd}". Введите "HELP" для справки.`, '#ff3344');
  }

  // Проверка статуса авторизации в ЛК
  const token = localStorage.getItem('dnp_token');
  const cabinetBtn = document.getElementById('cabinetBtn');
  if (token && cabinetBtn) {
    cabinetBtn.textContent = 'КАБИНЕТ (ONLINE)';
    cabinetBtn.style.borderColor = '#00f0ff';
    cabinetBtn.style.color = '#00f0ff';
  }
});