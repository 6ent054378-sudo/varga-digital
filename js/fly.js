/* Летающие картинки. Контейнеру [data-fly="имя"] подставляются слои из window.FLY_DATA:
   вход слоёв с разных сторон, лёгкое плавание, смещение от мыши (параллакс). Без движения при prefers-reduced-motion. */
(function () {
  var data = window.FLY_DATA;
  var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-fly]"));
  if (!data || !boxes.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function rnd(i, k) { var x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); }

  function build(box) {
    var d = data[box.getAttribute("data-fly")];
    if (!d) return null;
    box.style.aspectRatio = d.ratio[0] + " / " + d.ratio[1];
    if (d.bg) {
      var bg = document.createElement("img");
      bg.className = "fly__bg"; bg.src = d.bg; bg.alt = ""; bg.decoding = "async";
      box.appendChild(bg);
      box.classList.add("fly--tile");
    }
    var items = d.layers.map(function (l, i) {
      var layer = document.createElement("div");
      layer.className = "fly__layer";
      layer.style.left = l.x + "%"; layer.style.top = l.y + "%"; layer.style.width = l.w + "%"; layer.style.height = l.h + "%";
      var cx = l.x + l.w / 2 - 50, cy = l.y + l.h / 2 - 50;
      var len = Math.sqrt(cx * cx + cy * cy) || 1;
      layer.style.setProperty("--ex", (cx / len * 46).toFixed(0) + "px");
      layer.style.setProperty("--ey", (cy / len * 46 + 12).toFixed(0) + "px");
      layer.style.setProperty("--delay", (0.08 + i * 0.09).toFixed(2) + "s");
      var area = (l.w * l.h) / 10000;
      var depth = 8 + Math.max(0, 1 - Math.min(1, area * 2.6)) * 26;
      var par = document.createElement("div");
      par.className = "fly__par"; par.style.setProperty("--d", depth.toFixed(1));
      var img = document.createElement("img");
      img.className = "fly__img"; img.src = l.src; img.alt = ""; img.decoding = "async";
      img.style.setProperty("--dur", (6.5 + rnd(i, 1) * 4).toFixed(1) + "s");
      img.style.setProperty("--bob", (-rnd(i, 2) * 8).toFixed(1) + "s");
      img.style.setProperty("--amp", (5 + rnd(i, 3) * 9).toFixed(0) + "px");
      img.style.setProperty("--fx", ((rnd(i, 4) - .5) * 8).toFixed(1) + "px");
      img.style.setProperty("--rot", ((rnd(i, 5) - .5) * 1.6).toFixed(2) + "deg");
      par.appendChild(img); layer.appendChild(par); box.appendChild(layer);
      return layer;
    });
    return items;
  }

  var active = [];
  boxes.forEach(function (box) {
    var items = build(box);
    if (!items) return;
    if (reduce) { box.classList.add("is-in"); return; }
    function start() {
      box.classList.add("is-in");
      var last = items.length * 90 + 1500;
      setTimeout(function () { box.classList.add("is-live"); }, last);
      active.push(box);
    }
    if (!("IntersectionObserver" in window)) { start(); return; }
    var io = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect(); start();
    }, { threshold: 0.2 });
    io.observe(box);
  });

  /* Параллакс: слои смещаются за курсором. Плавное догоняние через requestAnimationFrame */
  if (reduce || !fine) return;
  var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
  function tick() {
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    active.forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      b.style.setProperty("--px", cx.toFixed(3)); b.style.setProperty("--py", cy.toFixed(3));
    });
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(tick); else running = false;
  }
  window.addEventListener("pointermove", function (e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: true });
})();
