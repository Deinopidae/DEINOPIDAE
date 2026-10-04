(function () {
  var token = localStorage.getItem("dnp_auth_token");
  if (!token) {
    window.location.href = "../auth.html";
    return;
  }

  var preview = document.getElementById("cfg-avatar-preview");
  var fileInput = document.getElementById("cfg-avatar-file");
  var urlInput = document.getElementById("cfg-avatar-url");
  var nameInput = document.getElementById("cfg-display-name");
  var msg = document.getElementById("cfg-status-msg");
  var currentAvatar = "";

  fetch("https://deinopidae-api.onrender.com/api/user/profile", {
    headers: { "Authorization": "Bearer " + token }
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.account) {
        nameInput.value = data.account.displayName || data.account.username;
        if (data.account.avatar) {
          preview.src = data.account.avatar;
          currentAvatar = data.account.avatar;
        }
        var radios = document.getElementsByName("pda-act-status");
        for (var i = 0; i < radios.length; i++) {
          if (radios[i].value === data.account.activityStatus) {
            radios[i].checked = true;
          }
        }
      }
    });

  fileInput.addEventListener("change", function () {
    var f = fileInput.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      currentAvatar = e.target.result;
    };
    reader.readAsDataURL(f);
  });

  urlInput.addEventListener("input", function () {
    var v = urlInput.value.trim();
    if (v.startsWith("http")) {
      preview.src = v;
      currentAvatar = v;
    }
  });

  document.getElementById("cfg-save-btn").addEventListener("click", function () {
    msg.style.color = "var(--pda-accent)";
    msg.textContent = "[SYS] Запись изменений в dnp_auth_db...";

    var actStatus = "В активе";
    var radios = document.getElementsByName("pda-act-status");
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) actStatus = radios[i].value;
    }

    fetch("https://deinopidae-api.onrender.com/api/user/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        displayName: nameInput.value.trim(),
        avatar: currentAvatar,
        activityStatus: actStatus
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success) {
          localStorage.setItem("dnp_active_user", JSON.stringify(res.user));
          msg.style.color = "var(--pda-status-ok)";
          msg.textContent = "[УСПЕХ] Параметры КПК сохранены.";
        } else {
          msg.style.color = "var(--pda-status-err)";
          msg.textContent = "[ОТКАЗ] " + (res.error || "Ошибка сохранения");
        }
      })
      .catch(function () {
        msg.style.color = "var(--pda-status-err)";
        msg.textContent = "[СБОЙ СЕТИ] Сервер недоступен.";
      });
  });
})();