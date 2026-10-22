/* Калькулятор окупаемости на странице. Считает через Estimate, пишет в разметку. */
(function () {
  var form = document.getElementById("calcForm");
  if (!form) return;
  var E = window.Estimate, cfg = window.SITE_CONFIG;
  var out = {};
  Array.prototype.forEach.call(document.querySelectorAll("[data-out]"), function (n) { out[n.getAttribute("data-out")] = n; });

  function val(name) { return form.elements[name].value; }
  function tariff() {
    var r = form.querySelector('input[name="tariff"]:checked');
    return r ? r.value : "growth";
  }
  function fmt(n) { return String(Math.round(n * 10) / 10).replace(".", ","); }

  function render() {
    var fee = cfg.prices.marketing[tariff()];
    var r = E.payback({ check: val("check"), margin: val("margin"), budget: val("budget"), cpl: val("cpl"), conv: val("conv"), fee: fee });
    out.leads.textContent = String(Math.round(r.leads));
    out.contracts.textContent = fmt(r.contracts);
    out.need.textContent = r.profitPerContract > 0 ? fmt(r.need) : "0";
    out.profit.textContent = E.rub(r.profitMonth);
    out.ad.textContent = E.rub(r.costMonth - fee);
    out.fee.textContent = E.rub(fee);
    out.net.textContent = E.rub(r.net);
    out.net.classList.toggle("is-neg", r.net < 0);
    var v = out.verdict;
    v.classList.toggle("is-neg", !r.ok);
    if (r.costMonth <= 0 || r.profitPerContract <= 0) {
      v.textContent = "Введите средний чек, маржу и рекламный бюджет, и мы посчитаем.";
      v.classList.add("is-neg");
    } else if (r.ok) {
      v.textContent = "При этих допущениях маркетинг окупается: нужно " + fmt(r.need) + " договора в месяц, ожидается " + fmt(r.contracts) + ".";
    } else {
      v.textContent = "При этих допущениях маркетинг не окупается: нужно " + fmt(r.need) + " договора в месяц, ожидается " + fmt(r.contracts) + ". На разборе проверим, как это изменить: оффер, цена заявки, конверсия.";
    }
  }

  /* Выбор ниши: подставляет цену заявки из ориентиров и показывает диапазон */
  var nicheSel = document.getElementById("calcNiche"), cplBox = document.getElementById("calcCpl");
  var cplValue = document.getElementById("cplValue"), cplNote = document.getElementById("cplNote");
  var list = window.NICHES || [];
  function groupNum(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0"); }
  function span(n) { return n.lo === n.hi ? groupNum(n.v) + "\u00a0₽" : groupNum(n.lo) + " - " + groupNum(n.hi) + "\u00a0₽"; }


  function saveNiche(name, cpl) {
    try { window.sessionStorage.setItem("vd_niche", JSON.stringify({ niche: name, cpl: cpl })); } catch (e) { /* без хранилища ниша просто не попадёт в квиз */ }
  }

  function onNiche() {
    var v = nicheSel.value;
    if (!v) { cplBox.hidden = true; return; }
    var cplField = form.elements.cpl, budget = Number(String(val("budget")).replace(/\s/g, "")) || 0;
    cplBox.hidden = false;
    if (v === "other") {
      cplField.value = group(E.DEFAULTS.cpl);
      cplValue.textContent = "около " + groupNum(E.DEFAULTS.cpl) + "\u00a0₽";
      cplNote.textContent = "Для вашей ниши мы пока не набрали цену заявки и берём осторожные " + groupNum(E.DEFAULTS.cpl) + " ₽. Точную цифру назовём на разборе.";
      saveNiche("Другая ниша", E.DEFAULTS.cpl);
    } else {
      var n = list[Number(v)];
      cplField.value = group(n.v);
      cplValue.textContent = span(n);
      var leadsTxt = budget > 0 && n.lo > 0 ? " На " + groupNum(budget) + " ₽ рекламы это примерно " + groupNum(budget / n.hi) + (n.lo !== n.hi ? " - " + groupNum(budget / n.lo) : "") + " заявок в месяц." : "";
      cplNote.textContent = "Ориентир с НДС по запускам: " + n.geo + "." + (n.one ? " Данные по одному городу, в вашем цена будет другой." : "") + leadsTxt + " Для расчёта берём " + groupNum(n.v) + " ₽.";
      saveNiche(n.n, n.v);
    }
    window.Lead.goal("calc_niche");
    render();
  }
  if (nicheSel) { window.NicheSelect.fill(nicheSel); nicheSel.addEventListener("change", onNiche); }

  function group(v) {
    var d = String(v).replace(/[^\d]/g, "");
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
  ["check", "budget", "cpl"].forEach(function (n) {
    var f = form.elements[n];
    f.value = group(f.value);
    f.addEventListener("input", function () { f.value = group(f.value); });
  });

  var timer = null, touched = false;
  form.addEventListener("input", function (e) {
    if (e.target && e.target.name === "cpl" && cplBox && !cplBox.hidden) cplNote.textContent = "Вы задали свою цену заявки в допущениях: " + groupNum(Number(String(e.target.value).replace(/\s/g, "")) || 0) + " ₽.";
    if (!touched) { touched = true; window.Lead.goal("calc_used"); }
    window.clearTimeout(timer);
    timer = window.setTimeout(render, 60);
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  render();
})();
