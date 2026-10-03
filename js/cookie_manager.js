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

    remove: function(name) {
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    },

    getSessionToken: function() {
      return this.get('dnp_session_token');
    }
  };
})();