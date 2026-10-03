// Менеджер сессий и Cookie
(function() {
  window.CookieManager = {
    get: function(name) {
      var matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
      return matches ? decodeURIComponent(matches[1]) : undefined;
    },

    set: function(name, value, days) {
      var d = new Date();
      d.setTime(d.getTime() + ((days || 30) * 24 * 60 * 60 * 1000));
      document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + d.toUTCString() + "; path=/; SameSite=Lax";
    },

    getUserToken: function() {
      var token = this.get('dnp_user_token');
      if (!token) {
        token = 'OP_' + Math.random().toString(36).substring(2, 9).toUpperCase() + '_' + Date.now().toString(36).toUpperCase();
        this.set('dnp_user_token', token, 30);
      }
      return token;
    }
  };

  // Инициализация токена при загрузке
  window.addEventListener('DOMContentLoaded', function() {
    window.CookieManager.getUserToken();
  });
})();