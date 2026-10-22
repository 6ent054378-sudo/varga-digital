/* Телефон, проверка, UTM, отправка заявки, цели Метрики. */
(function () {
  var cfg = window.SITE_CONFIG;
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid", "from"];
  var STORE = "vd_utm";

  function read() {
    var out = {}, q = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (k) { if (q.get(k)) out[k] = q.get(k).slice(0, 200); });
    return out;
  }

  /* Метки сохраняются на время визита, чтобы они дошли до заявки и со страницы "Спасибо" */
  function utm() {
    var cur = read();
    try {
      if (Object.keys(cur).length) { window.sessionStorage.setItem(STORE, JSON.stringify(cur)); return cur; }
      var saved = window.sessionStorage.getItem(STORE);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* хранилище недоступно, берём только из адреса */ }
    return cur;
  }

  /* Маску не ставим: люди вводят 8 вместо +7, маска мешает. Проверяем только число цифр. */
  function digits(v) { return String(v || "").replace(/\D/g, ""); }
  function validPhone(v) {
    var d = digits(v);
    return d.length === 11 && (d.charAt(0) === "7" || d.charAt(0) === "8") || d.length === 10;
  }
  function normalizePhone(v) {
    var d = digits(v);
    if (d.length === 10) d = "7" + d;
    if (d.charAt(0) === "8") d = "7" + d.slice(1);
    return "+" + d;
  }

  function goal(name) {
    if (cfg.metrikaId && typeof window.ym === "function") window.ym(cfg.metrikaId, "reachGoal", name);
  }

  function isLocal() {
    return cfg.demo === true || location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  }

  function send(payload) {
    payload.site = "varga-digital";
    payload.utm = utm();
    payload.page = location.origin + location.pathname;
    payload.sentAt = new Date().toISOString();
    if (!cfg.webhookUrl) return isLocal() ? Promise.resolve({ demo: true }) : Promise.reject(new Error("no-webhook"));
    return fetch(cfg.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error("http-" + r.status); return r; });
  }

  /* Ссылка из подвала клиентского сайта: ?from=имя-сайта запоминается сразу при загрузке */
  utm();

  window.Lead = { validPhone: validPhone, normalizePhone: normalizePhone, send: send, goal: goal, isLocal: isLocal, utm: utm };
})();
