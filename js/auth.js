(function() {
  "use strict";

  var tabLogin = document.getElementById("tab-login-btn");
  var tabReg = document.getElementById("tab-reg-btn");
  var formLogin = document.getElementById("form-login");
  var formReg = document.getElementById("form-register");
  var message = document.getElementById("auth-msg");
  if (!tabLogin || !tabReg || !formLogin || !formReg || !message) return;

  function setActiveForm(isRegistration) {
    tabLogin.classList.toggle("is-active", !isRegistration);
    tabReg.classList.toggle("is-active", isRegistration);
    tabLogin.setAttribute("aria-selected", String(!isRegistration));
    tabReg.setAttribute("aria-selected", String(isRegistration));
    formLogin.hidden = isRegistration;
    formReg.hidden = !isRegistration;
    message.textContent = "";
  }

  function showMessage(text, state) {
    message.textContent = text;
    message.dataset.state = state;
  }

  tabLogin.addEventListener("click", function() { setActiveForm(false); });
  tabReg.addEventListener("click", function() { setActiveForm(true); });

  formReg.addEventListener("submit", async function(event) {
    event.preventDefault();
    var username = document.getElementById("reg-username").value.trim();
    var roblox = document.getElementById("reg-roblox").value.trim();
    var password = document.getElementById("reg-pass").value;
    var confirmation = document.getElementById("reg-pass2").value;
    if (password !== confirmation) {
      showMessage("[ОШИБКА] Введенные пароли не совпадают.", "error");
      return;
    }

    var submitButton = formReg.querySelector('[type="submit"]');
    submitButton.disabled = true;
    showMessage("[SYS] Регистрация аккаунта в комплексе...", "pending");
    try {
      var response = await window.DnpApi.requestJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: username, roblox: roblox, password: password })
      });
      if (!response || !response.success || !response.user || !response.user.token) {
        throw new Error(response && response.error ? response.error : "Ошибка регистрации");
      }
      localStorage.setItem("dnp_auth_token", response.user.token);
      localStorage.setItem("dnp_active_user", JSON.stringify(response.user));
      showMessage("[УСПЕХ] Аккаунт создан. Переход в систему...", "success");
      window.setTimeout(function() { window.location.href = "index.html"; }, 500);
    } catch (error) {
      showMessage(error.status === 0
        ? "[СБОЙ СЕТИ] Сервер недоступен. Повторите попытку позже."
        : "[ОТКАЗ] " + error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  formLogin.addEventListener("submit", async function(event) {
    event.preventDefault();
    var identifier = document.getElementById("login-identifier").value.trim();
    var password = document.getElementById("login-pass").value;
    var submitButton = formLogin.querySelector('[type="submit"]');
    submitButton.disabled = true;
    showMessage("[SYS] Проверка учетных данных...", "pending");

    try {
      var response = await window.DnpApi.requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier, password: password })
      });
      if (!response || !response.success || !response.user || !response.user.token) {
        throw new Error(response && response.error ? response.error : "Неверный логин или пароль");
      }
      localStorage.setItem("dnp_auth_token", response.user.token);
      localStorage.setItem("dnp_active_user", JSON.stringify(response.user));
      showMessage("[УСПЕХ] Доступ разрешен. Вход в систему...", "success");
      window.setTimeout(function() { window.location.href = "index.html"; }, 500);
    } catch (error) {
      showMessage(error.status === 0
        ? "[СБОЙ СЕТИ] Сервер недоступен. Повторите попытку позже."
        : "[ОТКАЗ] " + error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
})();
