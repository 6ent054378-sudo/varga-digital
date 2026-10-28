/* Анимации сайта: слова заголовка, появление блоков при прокрутке, фото, индикатор. Стили в css/motion.css.
   При prefers-reduced-motion не запускается совсем: страница остаётся статичной. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* Шапка и индикатор работают всегда, кроме reduce */
  var header = document.querySelector(".header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (reduce || !("IntersectionObserver" in window)) return;
  root.classList.add("motion");

  var bar = document.createElement("div");
  bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  /* Заголовок по словам: разметка внутри (плашка) сохраняется, слова оборачиваются */
  var h1 = document.querySelector(".hero .h1");
  if (h1) {
    var n = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) { split(child); return; }
        if (child.nodeType !== 3) return;
        var text = child.textContent, frag = document.createDocumentFragment();
        text.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var wrap = document.createElement("span"), inner = document.createElement("span");
          wrap.className = "w"; inner.textContent = part;
          inner.style.setProperty("--wd", (140 + n * 70) + "ms");
          n += 1;
          wrap.appendChild(inner); frag.appendChild(wrap);
        });
        node.replaceChild(frag, child);
      });
    })(h1);
  }

  /* Что появляется при прокрутке */
  var TARGETS = ".hero__price, .hero .lead, .hero__actions, .facts li, .who__row > *, .head > *, .leak, .rows__head, .rows .row, .svc, .stages .stage, .tiers .tier, .tiers__note, .pack, .seg, .case, .hero__proof, .reviews > *, .founder > *, .ai > *, .gx > *, .quiz-grid > *, .faq > *, .final__row > *, .footer__grid > *, .photo, .vs, .track";
  var FLAGS = ".vs, .track, .hero .h1";
  var seen = [];
  var els = Array.prototype.slice.call(document.querySelectorAll(TARGETS));
  var HERO_DELAY = { ".hero__price": 0, ".hero .lead": 520, ".hero__actions": 660 };
  els.forEach(function (el) {
    if (el.matches(FLAGS)) return;
    var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(TARGETS); });
    var idx = Math.max(0, sibs.indexOf(el));
    var delay = Math.min(idx, 5) * 90;
    Object.keys(HERO_DELAY).forEach(function (k) { if (el.matches(k)) delay = HERO_DELAY[k]; });
    if (el.matches(".facts li")) delay = 780 + idx * 110;
    el.style.setProperty("--rd", delay + "ms");
    el.classList.add("rv");
    seen.push(el);
  });
  /* вложенные цели (фото внутри блока) не дублируем */
  seen = seen.filter(function (el) {
    var p = el.parentElement && el.parentElement.closest(".rv");
    if (p) { el.classList.remove("rv"); el.style.removeProperty("--rd"); return false; }
    return true;
  });
  var flags = Array.prototype.slice.call(document.querySelectorAll(FLAGS));

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  seen.concat(flags).forEach(function (el) { io.observe(el); });

  /* Индикатор прокрутки и мягкий сдвиг фото */
  var photos = [];
  function collectPhotos() { photos = Array.prototype.slice.call(document.querySelectorAll(".photo.has-photo")); }
  var ticking = false;
  function frame() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ")";
    var vh = window.innerHeight;
    photos.forEach(function (p) {
      var r = p.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var k = ((r.top + r.height / 2) / vh - 0.5) * 2; /* от -1 до 1 */
      var img = p.firstElementChild;
      if (img && img.tagName === "IMG") img.style.setProperty("--py", (-k * 14).toFixed(1) + "px");
    });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  window.addEventListener("load", function () { collectPhotos(); req(); });
  setTimeout(function () { collectPhotos(); req(); }, 1500);
  collectPhotos(); req();
})();
