/* Расчёты окупаемости и подбор тарифа. Без интерфейса, чтобы проверять тестами.
   Все допущения (цена заявки, конверсия) оценочные: они показываются на странице и меняются самим посетителем. */
(function () {
  var cfg = window.SITE_CONFIG;

  var DEFAULTS = { cpl: 2000, conv: 2, margin: 15 };

  function num(v, fallback) {
    if (v === undefined || v === null) return fallback;
    var s = String(v).replace(/\s/g, "").replace(",", ".");
    if (s === "") return fallback;
    var n = Number(s);
    return isFinite(n) && n >= 0 ? n : fallback;
  }

  /* Окупаемость.
     check: средний чек, ₽. margin: маржа с договора, %. budget: реклама в месяц, ₽.
     cpl: цена заявки, ₽. conv: доля заявок, ставших договорами, %. fee: плата агентству в месяц, ₽. */
  function payback(p) {
    var check = num(p.check, 0), margin = num(p.margin, DEFAULTS.margin), budget = num(p.budget, 0);
    var cpl = num(p.cpl, DEFAULTS.cpl), conv = num(p.conv, DEFAULTS.conv), fee = num(p.fee, 0);
    var leads = cpl > 0 ? budget / cpl : 0;
    var contracts = leads * conv / 100;
    var profitPerContract = check * margin / 100;
    var costMonth = budget + fee;
    var profitMonth = contracts * profitPerContract;
    var need = profitPerContract > 0 ? costMonth / profitPerContract : 0; /* договоров в месяц до нуля */
    return {
      leads: leads, contracts: contracts, profitPerContract: profitPerContract,
      costMonth: costMonth, profitMonth: profitMonth, net: profitMonth - costMonth,
      need: need, ok: profitMonth >= costMonth && costMonth > 0
    };
  }

  /* Три варианта расчёта: осторожный, базовый, оптимистичный (цена заявки и конверсия меняются на 30%) */
  function scenarios(p) {
    var cpl = num(p.cpl, DEFAULTS.cpl), conv = num(p.conv, DEFAULTS.conv);
    function make(label, cplK, convK) {
      var r = payback(Object.assign({}, p, { cpl: cpl * cplK, conv: conv * convK }));
      r.label = label;
      return r;
    }
    return [make("Осторожный", 1.3, 0.7), make("Базовый", 1, 1), make("Оптимистичный", 0.7, 1.3)];
  }

  var CHECK_MID = { "До 100 тыс. ₽": 60000, "100 - 500 тыс. ₽": 250000, "500 тыс. - 2 млн ₽": 1000000, "Больше 2 млн ₽": 3000000 };
  var BUDGET_MID = { "До 100 тыс. ₽": 80000, "100 - 300 тыс. ₽": 200000, "300 - 700 тыс. ₽": 500000, "Больше 700 тыс. ₽": 900000 };

  /* Подбор тарифа по ответам квиза. Возвращает ключ тарифа или услуги. */
  function recommend(a) {
    a = a || {};
    if (a.need === "Исследование ниши и конкурентов") return "research";
    if (a.need === "Внедрение AI") return "ai";
    var b = BUDGET_MID[a.budget] || 0, big = a.check === "Больше 2 млн ₽" || a.check === "500 тыс. - 2 млн ₽";
    if (a.sales === "Отдел продаж" && b >= 500000) return "scale";
    if (b >= 500000 && big) return "scale";
    if (b >= 200000 || a.sales === "Один менеджер" || a.sales === "Отдел продаж") return "growth";
    return "start";
  }

  var NAMES = { start: "Старт", growth: "Рост", scale: "Масштаб", research: "Исследование", ai: "Внедрение AI" };
  function priceOf(key) {
    var p = cfg.prices;
    if (key === "start" || key === "growth" || key === "scale") return p.marketing[key];
    if (key === "research") return p.research.express;
    if (key === "ai") return p.ai;
    return 0;
  }

  function rub(n) {
    var r = Math.round(n);
    return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
  }

  window.Estimate = {
    DEFAULTS: DEFAULTS, payback: payback, scenarios: scenarios, recommend: recommend,
    nameOf: function (k) { return NAMES[k] || ""; }, priceOf: priceOf, rub: rub,
    checkMid: function (label) { return CHECK_MID[label] || 0; },
    budgetMid: function (label) { return BUDGET_MID[label] || 0; }
  };
})();
