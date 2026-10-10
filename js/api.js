(function() {
  "use strict";

  var API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? ""
    : "https://deinopidae-api.onrender.com";
  var DEFAULT_TIMEOUT = 15000;

  function createRequestError(message, status, payload) {
    var error = new Error(message);
    error.status = status;
    error.payload = payload;
    return error;
  }

  async function request(path, options) {
    var requestOptions = Object.assign({}, options || {});
    var headers = new Headers(requestOptions.headers || {});
    var token = localStorage.getItem("dnp_auth_token");
    var controller = new AbortController();
    var timeout = setTimeout(function() {
      controller.abort();
    }, requestOptions.timeout || DEFAULT_TIMEOUT);
    var externalSignal = requestOptions.signal;
    var abortOnExternal = function() { controller.abort(); };

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", "Bearer " + token);
    }
    if (requestOptions.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Accept", "application/json");
    delete requestOptions.timeout;
    delete requestOptions.signal;
    requestOptions.headers = headers;
    requestOptions.signal = controller.signal;

    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", abortOnExternal, { once: true });
    }

    try {
      var response = await window.fetch(/^https?:\/\//i.test(path) ? path : API_BASE + path, requestOptions);
      return response;
    } catch (error) {
      if (error.name === "AbortError") {
        throw createRequestError("Request timed out or was cancelled.", 0);
      }
      throw createRequestError("Network connection failed.", 0);
    } finally {
      clearTimeout(timeout);
      if (externalSignal) externalSignal.removeEventListener("abort", abortOnExternal);
    }
  }

  async function requestJson(path, options) {
    var response = await request(path, options);
    var payload = await response.json().catch(function() { return null; });
    if (!response.ok) {
      throw createRequestError(
        payload && payload.error ? payload.error : "Request failed with HTTP " + response.status,
        response.status,
        payload
      );
    }
    return payload;
  }

  window.DnpApi = Object.freeze({
    baseUrl: API_BASE,
    request: request,
    requestJson: requestJson
  });
})();
