/* Подстановка данных из config.js в готовую разметку: цены, контакты, реквизиты, кейсы, отзывы, панель первого экрана. */
(function () {
  var cfg = window.SITE_CONFIG, E = window.Estimate;

  function get(path) {
    return path.split(".").reduce(function (o, k) { return o && o[k]; }, cfg.prices);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function bindPrices(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-price]"), function (n) {
      var v = get(n.getAttribute("data-price"));
      if (v) n.textContent = E.rub(v);
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-six]"), function (n) {
      var v = E.priceOf(n.getAttribute("data-six"));
      if (v) n.textContent = E.rub(v * 6);
    });
  }

  function heroPanel() {
    var box = document.getElementById("heroPanel");
    if (!box) return;
    var d = { check: 1000000, margin: 20, budget: 200000, fee: cfg.prices.marketing.growth };
    var r = E.payback(d);
    var set = function (k, v) { var n = box.querySelector('[data-bind="' + k + '"]'); if (n) n.textContent = v; };
    set("budget", E.rub(d.budget));
    set("leads", String(Math.round(r.leads)));
    set("contracts", String(Math.round(r.contracts * 10) / 10).replace(".", ","));
    set("profit", E.rub(r.profitMonth));
    set("cost", E.rub(r.costMonth));
    var net = box.querySelector('[data-bind="net"]');
    if (net) { net.textContent = E.rub(r.net); net.classList.toggle("is-neg", r.net < 0); }
    var bar = box.querySelector('[data-bind="bar"]');
    if (bar) {
      var share = r.costMonth > 0 ? Math.min(100, Math.round(r.profitMonth / r.costMonth * 100)) : 0;
      window.requestAnimationFrame(function () { window.setTimeout(function () { bar.style.width = share + "%"; }, 250); });
    }
  }

  function link(href, text, cls) {
    var a = el("a", cls || "", text);
    a.href = href;
    if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }

  function contactItems() {
    var c = cfg.contacts || {}, out = [];
    if (c.phone) out.push({ href: "tel:" + c.phone, text: c.phoneText || c.phone });
    if (c.telegram) out.push({ href: c.telegram, text: "Telegram" });
    if (c.whatsapp) out.push({ href: c.whatsapp, text: "WhatsApp" });
    if (c.max) out.push({ href: c.max, text: "MAX" });
    if (cfg.email) out.push({ href: "mailto:" + cfg.email, text: cfg.email });
    return out;
  }

  function contacts() {
    var items = contactItems();
    var f = document.getElementById("footerContacts");
    if (f) items.forEach(function (it) { var li = el("li"); li.appendChild(link(it.href, it.text)); f.appendChild(li); });
    var fl = document.getElementById("founderLinks");
    if (fl) items.filter(function (it) { return /^https?:/.test(it.href); }).forEach(function (it) {
      var li = el("li"); li.appendChild(link(it.href, "Написать в " + it.text, "btn btn--ghost btn--sm")); fl.appendChild(li);
    });
    var lg = document.getElementById("legalLine");
    if (lg) lg.textContent = cfg.legal || "";
  }

  function founder() {
    var ph = document.getElementById("founderPhoto");
    if (ph && cfg.owner && cfg.owner.photo) {
      var img = el("img"); img.src = cfg.owner.photo; img.alt = cfg.owner.name + ", " + cfg.owner.role; img.loading = "lazy";
      ph.textContent = ""; ph.appendChild(img);
    }
  }

  function casesAndReviews() {
    var sec = document.getElementById("cases");
    if (!sec) return;
    var cs = cfg.cases || [], rv = cfg.reviews || [];
    if (!cs.length && !rv.length) return;
    var cl = document.getElementById("casesList"), rl = document.getElementById("reviewsList");
    cs.forEach(function (c) {
      var li = el("li", "case");
      li.appendChild(el("p", "muted small", c.niche + (c.period ? ", " + c.period : "")));
      li.appendChild(el("p", "case__res", c.result));
      if (c.budget) li.appendChild(el("p", "small", "Бюджет: " + c.budget));
      if (c.note) li.appendChild(el("p", "small muted", c.note));
      if (c.link) li.appendChild(link(c.link, "Подробнее"));
      cl.appendChild(li);
    });
    rv.forEach(function (r) {
      var li = el("li", "review");
      li.appendChild(el("p", "", r.text));
      var who = el("div", "review__who");
      if (r.photo) { var im = el("img"); im.src = r.photo; im.alt = r.name; im.loading = "lazy"; who.appendChild(im); }
      var t = el("div"); t.appendChild(el("strong", "", r.name)); t.appendChild(el("p", "small muted", r.role || ""));
      who.appendChild(t); li.appendChild(who); rl.appendChild(li);
    });
    sec.hidden = false;
  }

  bindPrices(document);
  heroPanel();
  contacts();
  founder();
  casesAndReviews();

  window.Bind = { prices: bindPrices, contactItems: contactItems };
})();
