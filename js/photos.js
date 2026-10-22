/* Фото на странице. Каждое место ждёт файл img/photos/<имя>.jpg.
   Если файла нет, место остаётся скрытым и блок выглядит законченным без фото.
   Места с одинаковым data-photo-group (ряд ниш, три разрыва, три услуги) показываются только все вместе,
   чтобы в ряду не было дыр. Файлы проверяются, только когда блок подходит к экрану. */
(function () {
  var DIR = "img/photos/";
  var spots = Array.prototype.slice.call(document.querySelectorAll("[data-photo], [data-photo-bg]"));
  if (!spots.length) return;

  function probe(name, done) {
    var im = new Image();
    im.onload = function () { done(im.src); };
    im.onerror = function () { done(null); };
    im.src = DIR + name + ".jpg";
  }

  function put(el, src) {
    if (el.hasAttribute("data-photo-bg")) {
      el.style.backgroundImage = "linear-gradient(rgba(19, 21, 25, .84), rgba(19, 21, 25, .9)), url(\"" + src + "\")";
      el.classList.add("has-photo");
      return;
    }
    var img = document.createElement("img");
    img.src = src;
    img.alt = el.getAttribute("data-alt") || "";
    img.decoding = "async";
    el.insertBefore(img, el.firstChild);
    el.classList.add("has-photo");
    el.hidden = false;
    var list = el.parentNode;
    if (list && list.classList.contains("who__list")) list.classList.add("has-photos");
  }

  /* Группы: имя группы -> места. Одиночное место это группа из одного */
  var groups = {}, order = [];
  spots.forEach(function (el, i) {
    var g = el.getAttribute("data-photo-group") || ("single-" + i);
    if (!groups[g]) { groups[g] = []; order.push(g); }
    groups[g].push(el);
  });

  /* data-photo-min на первом месте группы: сколько фото достаточно, чтобы показать ряд (по умолчанию все) */
  function load(g) {
    var list = groups[g], found = [], left = list.length;
    var min = Number(list[0].getAttribute("data-photo-min")) || list.length;
    list.forEach(function (el, i) {
      probe(el.getAttribute("data-photo-bg") || el.getAttribute("data-photo"), function (src) {
        found[i] = src;
        left -= 1;
        if (left > 0) return;
        if (found.filter(Boolean).length < min) return;
        list.forEach(function (e, k) { if (found[k]) put(e, found[k]); else e.classList.add("no-photo"); });
      });
    });
  }

  function watchTarget(el) { return el.hidden ? el.parentNode : el; }

  order.forEach(function (g) {
    var target = watchTarget(groups[g][0]);
    if (!("IntersectionObserver" in window)) { load(g); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      load(g);
    }, { rootMargin: "800px 0px" });
    io.observe(target);
  });
})();
