(function() {
  var token = localStorage.getItem("dnp_auth_token");
  if (!token) { window.location.href = "../auth.html"; return; }

  var avatarPreview = document.getElementById("avatar-preview");
  var avatarFile = document.getElementById("avatar-file");
  var avatarUrl = document.getElementById("avatar-url");
  var nameInput = document.getElementById("set-displayname");
  var msg = document.getElementById("settings-msg");
  var currentAvatarBase64 = "";

  // Загрузка начальных данных
  fetch("https://deinopidae-api.onrender.com/api/user/profile", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.account) {
      nameInput.value = data.account.displayName || data.account.username;
      if (data.account.avatar) {
        avatarPreview.src = data.account.avatar;
        currentAvatarBase64 = data.account.avatar;
      }
      var radios = document.getElementsByName("activity-status");
      for (var i = 0; i < radios.length; i++) {
        if (radios[i].value === data.account.activityStatus) {
          radios[i].checked = true;
        }
      }
    }
  });

  avatarFile.addEventListener("change", function() {
    var file = avatarFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      avatarPreview.src = e.target.result;
      currentAvatarBase64 = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  avatarUrl.addEventListener("input", function() {
    if (avatarUrl.value.trim().startsWith("http")) {
      avatarPreview.src = avatarUrl.value.trim();
      currentAvatarBase64 = avatarUrl.value.trim();
    }
  });

  document.getElementById("save-settings-btn").addEventListener("click", function() {
    msg.style.color = "#00f0ff";
    msg.textContent = "[SYS] Сохранение конфигурации в dnp_auth_db...";

    var statusVal = "В активе";
    var radios = document.getElementsByName("activity-status");
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) statusVal = radios[i].value;
    }

    fetch("https://deinopidae-api.onrender.com/api/user/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        displayName: nameInput.value.trim(),
        avatar: currentAvatarBase64,
        activityStatus: statusVal
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        localStorage.setItem("dnp_active_user", JSON.stringify(data.user));
        msg.style.color = "#4af626";
        msg.textContent = "[УСПЕХ] Настройки сохранены!";
      } else {
        msg.style.color = "#ff5252";
        msg.textContent = "[ОШИБКА] " + (data.error || "Не удалось сохранить");
      }
    })
    .catch(function() {
      msg.style.color = "#ff5252";
      msg.textContent = "[СБОЙ СЕТИ] Ошибка соединения с сервером.";
    });
  });
})();