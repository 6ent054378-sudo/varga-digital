/* Страница "Спасибо": подставляет имя, канал связи, ориентир по окупаемости из ответов квиза. */
(function () {
  var cfg = window.SITE_CONFIG, E = window.Estimate;
  var res = null;
  try { res = JSON.parse(window.sessionStorage.getItem("vd_result") || "null"); } catch (e) { res = null; }

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }

  if (cfg.owner && cfg.owner.photo) {
    var ava = $("thxAva"), img = el("img"); img.src = cfg.owner.photo; img.alt = cfg.owner.name; ava.textContent = ""; ava.appendChild(img);
  }
  if (cfg.workHours) { var h = $("thxHours"); h.textContent = "Рабочее время: " + cfg.workHours + "."; h.hidden = false; }

  var actions = $("thxActions");
  window.Bind.contactItems().filter(function (it) { return /^https?:|^tel:/.test(it.href); }).forEach(function (it) {
    var a = el("a", "btn btn--ghost btn--sm", it.href.indexOf("tel:") === 0 ? "Позвонить" : "Написать в " + it.text);
    a.href = it.href; if (/^https?:/.test(it.href)) { a.target = "_blank"; a.rel = "noopener"; }
    actions.appendChild(a);
  });

  if (!res) return;

  if (res.name) $("thxTitle").textContent = "Спасибо, " + res.name + ", заявка у Дмитрия";
  if (res.channel) {
    $("thxContact").textContent = res.channel === "Звонок"
      ? "Дмитрий позвонит вам. Если не дозвонится, напишет в мессенджер. Номер на экране может быть незнакомым, это нормально."
      : "Дмитрий напишет вам в " + res.channel + " и задаст один вопрос: что для вас важнее всего в маркетинге сейчас.";
  }

  var a = res.answers || {};
  var check = E.checkMid(a.check), budget = E.budgetMid(a.budget);
  var key = res.tariff || E.recommend(a);
  var box = $("thxEstimate");
  if (check > 0 && budget > 0 && (key === "start" || key === "growth" || key === "scale")) {
    var fee = E.priceOf(key);
    var cplRef = 0;
    try { var pn = JSON.parse(window.sessionStorage.getItem("vd_niche") || "null"); cplRef = pn && pn.cpl > 0 ? Number(pn.cpl) : 0; } catch (e) { cplRef = 0; }
    var cpl = cplRef || E.DEFAULTS.cpl;
    var sc = E.scenarios({ check: check, margin: 15, budget: budget, fee: fee, cpl: cpl });
    $("thxAssump").textContent = "Допущения: цена заявки " + E.rub(cpl) + (cplRef ? " (ориентир по вашей нише)" : "") + " (±30%), 2% заявок становятся договорами, маржа 15%. Это оценка. Точные цифры посчитаем в разборе.";
    var rows = $("thxRows");
    [["Заявок в месяц", function (r) { return String(Math.round(r.leads)); }],
     ["Договоров в месяц", function (r) { return String(Math.round(r.contracts * 10) / 10).replace(".", ","); }],
     ["Прибыль минус реклама и тариф", function (r) { return E.rub(r.net); }]].forEach(function (row, i) {
      var tr = el("tr"); tr.appendChild(el("th", "", row[0]));
      sc.forEach(function (r) { var td = el("td", i === 2 && r.net < 0 ? "is-neg" : "", row[1](r)); tr.appendChild(td); });
      rows.appendChild(tr);
    });
    $("thxEstimateNote").textContent = "Для среднего чека «" + a.check + "» и рекламы «" + a.budget + "» в месяц, тариф «" + E.nameOf(key) + "» (" + E.rub(fee) + " в месяц).";
    var base = sc[1];
    var need = String(Math.round(base.need * 10) / 10).replace(".", ",");
    $("thxRec").textContent = base.ok
      ? "В базовом сценарии маркетинг окупается: нужно " + need + " договора в месяц, ожидается " + String(Math.round(base.contracts * 10) / 10).replace(".", ",") + ". Тариф окончательно подберём после разбора, по ответам ближе всего «" + E.nameOf(key) + "»."
      : "В базовом сценарии при чеке «" + a.check + "» маркетинг пока не окупается: нужно " + need + " договора в месяц, ожидается " + String(Math.round(base.contracts * 10) / 10).replace(".", ",") + ". На разборе проверим, что можно изменить: оффер, цену заявки, чек и маржу, и скажем честно, стоит ли запускаться.";
    box.hidden = false;
  } else if (key === "research" || key === "ai") {
    var note = $("thxEstimateNote");
    $("thxRec").textContent = key === "research"
      ? "По вашему запросу предлагаем исследование: экспресс от " + E.rub(cfg.prices.research.express) + " или полное от " + E.rub(cfg.prices.research.full) + ". Состав обсудим на разбор."
      : "По вашему запросу предлагаем внедрение AI за " + E.rub(cfg.prices.ai) + ". Состав и срок обсудим на разбор.";
    note.textContent = "";
    $("thxEstimate").querySelector("table").hidden = true;
    $("thxEstimate").querySelectorAll(".small")[1].hidden = true;
    box.hidden = false;
  }
})();
