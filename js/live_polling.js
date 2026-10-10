(function() {
  "use strict";

  var app = window.DnpApp = window.DnpApp || {};
  app.state = app.state || { employeeDb: {}, activeScreen: "ustav-01" };

  var baseDelay = 15000;
  var maxDelay = 120000;
  var failureCount = 0;
  var pollTimer = null;
  var pollInFlight = false;
  var lastDataHash = "";

  app.setNetStatus = function(isOnline) {
    var status = document.getElementById("dnp-net-status");
    if (!status) return;
    status.textContent = isOnline ? "STABLE" : "ERROR";
    status.classList.toggle("is-error", !isOnline);
  };

  function createActionButton(label, action, className) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.action = action;
    button.textContent = label;
    return button;
  }

  app.renderAuthHeader = function() {
    var slot = document.getElementById("dnp-auth-header-slot");
    if (!slot) return;
    slot.replaceChildren();

    var user = null;
    try {
      user = JSON.parse(localStorage.getItem("dnp_active_user") || "null");
    } catch (error) {
      localStorage.removeItem("dnp_active_user");
    }

    if (!user) {
      var authLink = document.createElement("a");
      authLink.href = "auth.html";
      authLink.className = "dnp-auth-btn";
      authLink.textContent = "ЛИЧНЫЙ КАБИНЕТ";
      slot.appendChild(authLink);
      return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "dnp-profile-menu";
    var pill = createActionButton(
      user.displayName || user.username || "OPERATOR",
      "toggleUserMenu",
      "dnp-user-pill"
    );
    pill.setAttribute("aria-expanded", "false");
    var avatar = document.createElement("span");
    avatar.className = "dnp-user-avatar";
    var avatarUrl = typeof user.avatar === "string" ? user.avatar : "";
    if (/^https:\/\//i.test(avatarUrl)) {
      var image = document.createElement("img");
      image.src = avatarUrl;
      image.alt = "";
      image.referrerPolicy = "no-referrer";
      avatar.appendChild(image);
    } else {
      avatar.textContent = String(user.displayName || user.username || "U").charAt(0).toUpperCase();
    }
    var name = document.createElement("span");
    name.className = "dnp-user-name";
    name.textContent = user.displayName || user.username || "OPERATOR";
    pill.replaceChildren(avatar, name);

    var dropdown = document.createElement("div");
    dropdown.className = "dnp-user-dropdown";
    dropdown.hidden = true;
    dropdown.append(
      createActionButton("Профиль", "openScreen", "dnp-dropdown-item"),
      createActionButton("Обращения", "openScreen", "dnp-dropdown-item"),
      createActionButton("Уведомления", "openScreen", "dnp-dropdown-item"),
      createActionButton("Выйти из аккаунта", "logout", "dnp-dropdown-item is-logout")
    );
    dropdown.children[0].dataset.screenName = "profile";
    dropdown.children[1].dataset.screenName = "tickets";
    dropdown.children[2].dataset.screenName = "notifications";
    wrapper.append(pill, dropdown);
    slot.appendChild(wrapper);
    var adminNav = document.getElementById("dnp-nav-admin");
    if (adminNav && adminNav.style.display !== "none") {
      var adminStatus = adminNav.querySelector("em");
      if (adminStatus) adminStatus.textContent = "ACTIVE";
    }
  };

  async function pollServerData() {
    if (pollInFlight) return;
    if (!navigator.onLine) {
      failureCount++;
      app.setNetStatus(false);
      schedulePoll();
      return;
    }

    pollInFlight = true;
    var synchronizationError = null;
    try {
      var token = localStorage.getItem("dnp_auth_token");
      if (token) {
        try {
        var auth = await window.DnpApi.requestJson("/api/auth/me");
        if (auth && auth.authenticated) {
          localStorage.setItem("dnp_active_user", JSON.stringify(auth.user));
          app.renderAuthHeader();
        } else if (auth && auth.authenticated === false) {
          localStorage.removeItem("dnp_active_user");
          localStorage.removeItem("dnp_auth_token");
          app.renderAuthHeader();
        }
        } catch (error) {
        if (error.status === 401) {
          localStorage.removeItem("dnp_active_user");
          localStorage.removeItem("dnp_auth_token");
          app.renderAuthHeader();
        } else {
          synchronizationError = error;
        }
        }
      } else {
        app.renderAuthHeader();
      }

      var employees = await window.DnpApi.requestJson("/api/users/data");
      var currentHash = JSON.stringify(employees);
      if (currentHash !== lastDataHash) {
        app.state.employeeDb = employees && typeof employees === "object" ? employees : {};
        lastDataHash = currentHash;
      }
      if (synchronizationError) throw synchronizationError;
      app.setNetStatus(true);
      failureCount = 0;
    } catch (error) {
      failureCount++;
      app.setNetStatus(false);
      console.error("Live data synchronization failed:", error.message);
    } finally {
      pollInFlight = false;
      schedulePoll();
    }
  }

  function schedulePoll() {
    if (pollTimer) window.clearTimeout(pollTimer);
    var delay = failureCount === 0
      ? baseDelay
      : Math.min(baseDelay * Math.pow(2, failureCount - 1), maxDelay);
    pollTimer = window.setTimeout(pollServerData, delay);
  }

  document.addEventListener("click", function(event) {
    var action = event.target.closest("[data-action]");
    var wrapper = document.querySelector(".dnp-profile-menu");
    if (wrapper && !wrapper.contains(event.target)) {
      var dropdown = wrapper.querySelector(".dnp-user-dropdown");
      var pill = wrapper.querySelector(".dnp-user-pill");
      dropdown.hidden = true;
      pill.setAttribute("aria-expanded", "false");
    }
    if (!action) return;

    if (action.dataset.action === "toggleUserMenu") {
      event.stopPropagation();
      var menu = action.nextElementSibling;
      menu.hidden = !menu.hidden;
      action.setAttribute("aria-expanded", String(!menu.hidden));
    } else if (action.dataset.action === "logout") {
      localStorage.removeItem("dnp_active_user");
      localStorage.removeItem("dnp_auth_token");
      var adminNavigation = document.getElementById("dnp-nav-admin");
      if (adminNavigation) adminNavigation.hidden = true;
      if (typeof app.toggleUstavEditorMode === "function") app.toggleUstavEditorMode(false);
      app.renderAuthHeader();
      if (typeof app.openScreen === "function") app.openScreen("ustav-01");
    }
  });

  window.addEventListener("online", function() {
    failureCount = 0;
    pollServerData();
  });

  app.renderAuthHeader();
  pollServerData();
})();
