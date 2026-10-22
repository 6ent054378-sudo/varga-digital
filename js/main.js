/* Общее поведение страницы: цели по кнопкам, липкая кнопка на телефоне, cookie. */
(function () {
  var L = window.Lead;

  Array.prototype.forEach.call(document.querySelectorAll("[data-goal]"), function (a) {
    a.addEventListener("click", function () { L.goal(a.getAttribute("data-goal")); });
  });

  /* Липкая кнопка: показываем после первого экрана, прячем у самого квиза и подвала */
  var sticky = document.getElementById("sticky"), hero = document.querySelector(".hero"), quiz = document.getElementById("quiz");
  var cookie = document.getElementById("cookie");
  function updateSticky() {
    if (!sticky || !hero) return;
    var pastHero = hero.getBoundingClientRect().bottom < 0;
    var q = quiz ? quiz.getBoundingClientRect() : null;
    var atQuiz = q && q.top < window.innerHeight * 0.8 && q.bottom > 0;
    var show = pastHero && !atQuiz;
    sticky.hidden = !show;
    if (cookie) { cookie.classList.toggle("is-up", show); cookie.classList.toggle("is-quiet", !!atQuiz); }
  }
  if (sticky && hero) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { updateSticky(); ticking = false; });
    }, { passive: true });
    updateSticky();
  }

  /* Честное ограничение: число разборов в неделю берётся из config.js, а не выдумывается */
  var slots = document.getElementById("slotsLine");
  if (slots && window.SITE_CONFIG.weeklySlots > 0) {
    slots.textContent = "Беру не больше " + window.SITE_CONFIG.weeklySlots + " разборов в неделю, чтобы делать каждый лично.";
    slots.hidden = false;
  }

  /* Cookie */
  var KEY = "vd_cookie_ok";
  function seen() { try { return window.localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  var ok = document.getElementById("cookieOk");
  if (cookie && !seen()) cookie.hidden = false;
  if (ok) ok.addEventListener("click", function () {
    cookie.hidden = true;
    try { window.localStorage.setItem(KEY, "1"); } catch (e) { /* без хранилища сообщение вернётся при следующем визите */ }
  });
})();
