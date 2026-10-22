/* Прибор на первом экране: ниша и бюджет дают цену заявки, число заявок и договоров.
   Выбор сразу переносится в калькулятор ниже, чтобы человек не вводил всё заново. */
(function () {
  var sel = document.getElementById("heroNiche");
  if (!sel) return;
  var E = window.Estimate, list = window.NICHES || [];
  var budget = document.getElementById("heroBudget"), budgetOut = document.getElementById("heroBudgetOut");
  var cplOut = document.getElementById("heroCpl"), note = document.getElementById("heroNote");
  var leadsOut = document.getElementById("heroLeads"), dealsOut = document.getElementById("heroDeals");
  var go = document.getElementById("heroGo");
  var calcSel = document.getElementById("calcNiche"), calcForm = document.getElementById("calcForm");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CONV = E.DEFAULTS.conv / 100;

  function g(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function span(lo, hi) { return lo === hi ? g(lo) : g(lo) + " - " + g(hi); }
  function deals(n) { return n < 10 ? String(Math.round(n * 10) / 10).replace(".", ",") : g(n); }

  window.NicheSelect.fill(sel);
  var all = window.NicheSelect.spread();
  var shown = { lo: all.lo, hi: all.hi }, raf = 0;

  /* Одно движение на странице: цифра цены плавно перетекает к новой */
  function animateTo(lo, hi) {
    window.cancelAnimationFrame(raf);
    if (reduce) { shown = { lo: lo, hi: hi }; cplOut.textContent = span(lo, hi); return; }
    var from = { lo: shown.lo, hi: shown.hi }, t0 = null, dur = 420;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      shown = { lo: from.lo + (lo - from.lo) * e, hi: from.hi + (hi - from.hi) * e };
      cplOut.textContent = span(Math.round(shown.lo / 10) * 10, Math.round(shown.hi / 10) * 10);
      if (k < 1) raf = window.requestAnimationFrame(step); else { shown = { lo: lo, hi: hi }; cplOut.textContent = span(lo, hi); }
    }
    raf = window.requestAnimationFrame(step);
  }

  function current() {
    var v = sel.value;
    if (v === "other") return { lo: E.DEFAULTS.cpl, hi: E.DEFAULTS.cpl, other: true };
    if (v === "") return { lo: all.lo, hi: all.hi, none: true };
    return list[Number(v)];
  }

  function fillTrack() {
    var p = (budget.value - budget.min) / (budget.max - budget.min) * 100;
    budget.style.setProperty("--fill", p + "%");
  }

  function render(animate) {
    var n = current(), b = Number(budget.value);
    budgetOut.textContent = g(b) + " ₽";
    fillTrack();
    if (animate) animateTo(n.lo, n.hi); else cplOut.textContent = span(n.lo, n.hi);
    cplOut.classList.toggle("is-live", !n.none);
    var lMin = b / n.hi, lMax = b / n.lo;
    leadsOut.textContent = span(lMin, lMax);
    dealsOut.textContent = Math.round(lMin * CONV * 10) === Math.round(lMax * CONV * 10) ? deals(lMin * CONV) : deals(lMin * CONV) + " - " + deals(lMax * CONV);
    if (n.none) note.textContent = "Разброс по " + list.length + " нишам, где у нас есть данные запусков. Выберите свою, и цифра станет точнее.";
    else if (n.other) note.textContent = "Для вашей ниши у нас пока нет накопленной цены, берём осторожные " + g(E.DEFAULTS.cpl) + " ₽. Точную назовём на разборе.";
    else note.textContent = "По запускам: " + n.geo + "." + (n.one ? " Данные по одному городу, в вашем цена будет другой." : "");
  }

  /* Перенос в калькулятор: ниша и бюджет */
  function sync() {
    if (calcForm) {
      var f = calcForm.elements.budget;
      f.value = g(budget.value).replace(/\s/g, " ");
      f.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (calcSel && calcSel.value !== sel.value) {
      calcSel.value = sel.value;
      calcSel.dispatchEvent(new Event("change"));
    }
  }

  sel.addEventListener("change", function () { render(true); sync(); window.Lead.goal("hero_niche"); });
  budget.addEventListener("input", function () { render(false); });
  budget.addEventListener("change", sync);
  if (go) go.addEventListener("click", sync);
  render(false);
})();
