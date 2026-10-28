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
      var top = el("div", "case__top");
      top.appendChild(el("p", "case__niche", c.niche));
      top.appendChild(el("p", "case__meta", (c.city ? c.city + ", " : "") + (c.period || "")));
      li.appendChild(top);
      if (c.cpa) {
        var big = el("p", "case__big");
        big.appendChild(el("strong", "", c.cpa));
        big.appendChild(el("span", "", "цена заявки"));
        li.appendChild(big);
      }
      var dl = el("dl", "case__stats");
      [["Расход", c.spend], ["Заявок", c.leads], ["Конверсия сайта", c.rate]].forEach(function (r) {
        if (!r[1]) return;
        var d = el("div"); d.appendChild(el("dt", "", r[0])); d.appendChild(el("dd", "", r[1])); dl.appendChild(d);
      });
      if (dl.children.length) li.appendChild(dl);
      if (c.result) li.appendChild(el("p", "case__res", c.result));
      if (c.note) li.appendChild(el("p", "small muted", c.note));
      if (c.img) {
        var a = el("a", "case__shot"); a.href = c.img; a.target = "_blank"; a.rel = "noopener";
        var im = el("img"); im.src = c.img; im.alt = c.imgAlt || c.niche; im.loading = "lazy";
        a.appendChild(im); li.appendChild(a);
      }
      var btn = el("a", "btn btn--dark btn--block", "Хочу так же");
      btn.href = "#quiz"; btn.setAttribute("data-goal", "cta_case");
      li.appendChild(btn);
      if (c.link) li.appendChild(link(c.link, "Подробнее"));
      cl.appendChild(li);
    });
    if (cs.length) {
      var cta = el("li", "case case--cta");
      cta.appendChild(el("p", "case__niche", "Ваша ниша"));
      cta.appendChild(el("p", "case__ctatitle", "Назовём цену заявки для вашего бизнеса до запуска и запишем её в договор"));
      var b2 = el("a", "btn btn--primary btn--block", "Узнать цену заявки");
      b2.href = "#quiz"; b2.setAttribute("data-goal", "cta_case_own");
      cta.appendChild(b2);
      cl.appendChild(cta);
    }
    rv.forEach(function (r) {
      var li = el("li", "review");
      li.appendChild(el("p", "", r.text));
      var who = el("div", "review__who");
      if (r.photo) { var im = el("img"); im.src = r.photo; im.alt = r.name; im.loading = "lazy"; who.appendChild(im); }
      var t = el("div"); t.appendChild(el("strong", "", r.name)); t.appendChild(el("p", "small muted", r.role || ""));
      who.appendChild(t); li.appendChild(who); rl.appendChild(li);
    });
    sec.hidden = false;
    var hp = document.getElementById("heroProof");
    var best = cs.filter(function (c) { return c.cpa && c.leads; }).sort(function (x, y) { return parseInt(y.leads, 10) - parseInt(x.leads, 10); })[0];
    if (hp && best) {
      hp.appendChild(document.createTextNode("Свежий запуск: "));
      hp.appendChild(el("strong", "", best.leads + " заявок по " + best.cpa));
      hp.appendChild(document.createTextNode(", " + best.niche.toLowerCase() + ", " + best.city + ". "));
      hp.appendChild(link("#cases", "Смотреть цифры"));
      hp.hidden = false;
    }
  }

  bindPrices(document);
  heroPanel();
  contacts();
  founder();
  casesAndReviews();

  window.Bind = { prices: bindPrices, contactItems: contactItems };
})();
