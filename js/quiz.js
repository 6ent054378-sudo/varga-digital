/* Квиз: 6 вопросов с автопереходом, затем контакты. Открытый блок на странице, не поп-ап. */
(function () {
  var box = document.getElementById("quizBox");
  if (!box) return;
  var Q = window.QUIZ, L = window.Lead, E = window.Estimate, cfg = window.SITE_CONFIG;
  var body = document.getElementById("quizBody"), bar = document.getElementById("quizProgress");
  var count = document.getElementById("quizCount"), back = document.getElementById("quizBack");

  var answers = {}, preset = {}, order = [], pos = 0, started = false, sending = false;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function clear() { while (body.firstChild) body.removeChild(body.firstChild); }

  /* Вопросы, на которые ответ уже задан (кнопки "Заказать исследование" и "Обсудить внедрение"), пропускаются */
  function buildOrder() {
    order = [];
    Q.steps.forEach(function (s, i) { if (!preset[s.key]) order.push(i); });
    order.push("contact");
  }

  function progress() {
    var total = order.length;
    bar.style.width = Math.round(pos / total * 100) + "%";
    count.textContent = pos < total - 1 ? "Вопрос " + (pos + 1) + " из " + (total - 1) : "Последний шаг";
    back.hidden = pos === 0;
  }

  function renderStep() {
    clear();
    progress();
    var idx = order[pos];
    if (idx === "contact") return renderContact();
    var s = Q.steps[idx];
    body.appendChild(el("h3", "quiz__q", s.q));
    var list = el("div", "quiz__opts");
    s.options.forEach(function (o) {
      var b = el("button", "opt" + (answers[s.key] === o ? " is-picked" : ""), o);
      b.type = "button";
      b.addEventListener("click", function () { pick(s, o, b); });
      list.appendChild(b);
    });
    body.appendChild(list);
  }

  function pick(s, o, b) {
    answers[s.key] = o;
    b.classList.add("is-picked");
    if (!started) { started = true; L.goal("quiz_start"); }
    L.goal("quiz_step_" + (pos + 1));
    window.setTimeout(function () { pos += 1; renderStep(); }, 200);
  }

  function renderContact() {
    var key = E.recommend(answers);
    body.appendChild(el("h3", "quiz__title", Q.contactTitle));
    body.appendChild(el("p", "quiz__sub", Q.contactText));

    var form = el("form", "quiz__form"); form.noValidate = true;
    var f1 = el("label", "field"); f1.appendChild(el("span", "", "Телефон"));
    var phone = el("input"); phone.type = "tel"; phone.name = "phone"; phone.autocomplete = "tel"; phone.inputMode = "tel"; phone.setAttribute("enterkeyhint", "send"); phone.placeholder = "+7 900 000-00-00"; phone.required = true;
    f1.appendChild(phone);
    var f2 = el("label", "field"); f2.appendChild(el("span", "", "Как к вам обращаться (по желанию)"));
    var name = el("input"); name.type = "text"; name.name = "name"; name.autocomplete = "given-name"; f2.appendChild(name);

    var fs = el("fieldset", "quiz__channels"); fs.appendChild(el("legend", "", "Где удобнее получить расчёт"));
    Q.channels.forEach(function (c, i) {
      var l = el("label", "seg"); var r = el("input"); r.type = "radio"; r.name = "channel"; r.value = c; if (i === 0) r.checked = true;
      l.appendChild(r); l.appendChild(el("span", "", c)); fs.appendChild(l);
    });

    var err = el("p", "quiz__error"); err.setAttribute("role", "alert");
    var submit = el("button", "btn btn--primary btn--block", "Получить расчёт и разбор"); submit.type = "submit";
    var legal = el("p", "quiz__legal small");
    legal.appendChild(document.createTextNode("Нажимая кнопку, вы соглашаетесь с "));
    var a = el("a", "", "политикой конфиденциальности"); a.href = "privacy.html"; legal.appendChild(a);
    legal.appendChild(document.createTextNode(" и обработкой персональных данных. Рекомендуем вам: тариф «" + E.nameOf(key) + "»."));

    [f1, f2, fs, err, submit, legal].forEach(function (n) { form.appendChild(n); });
    form.addEventListener("submit", function (e) { e.preventDefault(); submitForm(form, phone, name, err, submit, key); });
    body.appendChild(form);
  }

  function submitForm(form, phone, name, err, submit, key) {
    if (sending) return;
    err.textContent = "";
    if (!L.validPhone(phone.value)) { err.textContent = "Проверьте номер: нужно 10 цифр после +7, например 900 123-45-67."; phone.focus(); return; }
    var ch = form.querySelector('input[name="channel"]:checked');
    var picked = null;
    try { picked = JSON.parse(window.sessionStorage.getItem("vd_niche") || "null"); } catch (e) { picked = null; }
    var extra = picked && picked.niche ? { niche: picked.niche, cplRef: String(picked.cpl) + " ₽" } : {};
    var payload = {
      name: name.value.trim(), phone: L.normalizePhone(phone.value), channel: ch ? ch.value : "",
      formType: preset.need ? "Квиз, кнопка услуги" : "Квиз", tariff: E.nameOf(key), answers: Object.assign({}, preset, extra, answers)
    };
    sending = true; submit.disabled = true; submit.textContent = "Отправляем...";
    L.send(payload).then(function () {
      L.goal("lead_sent");
      try { window.sessionStorage.setItem("vd_result", JSON.stringify({ answers: payload.answers, tariff: key, name: payload.name, channel: payload.channel })); } catch (e) { /* без хранилища страница Спасибо покажет общий вариант */ }
      window.location.href = "thanks.html";
    }).catch(function () {
      sending = false; submit.disabled = false; submit.textContent = "Получить расчёт и разбор";
      var tg = cfg.contacts && cfg.contacts.telegram;
      err.textContent = "Не удалось отправить. Попробуйте ещё раз" + (tg ? " или напишите нам в Telegram." : ".");
    });
  }

  back.addEventListener("click", function () { if (pos > 0) { pos -= 1; renderStep(); } });

  /* Кнопки услуг заранее выбирают ответ "Что нужно" */
  function applyPreset(need) {
    preset = need ? { need: need } : {};
    answers = {}; pos = 0; buildOrder(); renderStep();
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-need]"), function (a) {
    a.addEventListener("click", function () { applyPreset(a.getAttribute("data-need")); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#quiz"]:not([data-need])'), function (a) {
    a.addEventListener("click", function () { if (preset.need) applyPreset(""); });
  });

  buildOrder();
  renderStep();
  window.Quiz = { applyPreset: applyPreset };
})();
