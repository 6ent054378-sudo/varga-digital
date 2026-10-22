/* Заполняет выпадающий список ниш (группы и ниши из niches-data.js). Значение пункта: номер ниши в списке или "other". */
(function () {
  function fill(select) {
    var list = window.NICHES || [], groups = {};
    list.forEach(function (n, i) { (groups[n.g] = groups[n.g] || []).push(i); });
    var other = select.querySelector('option[value="other"]');
    Object.keys(groups).sort().forEach(function (g) {
      var og = document.createElement("optgroup");
      og.label = g;
      groups[g].forEach(function (i) {
        var o = document.createElement("option");
        o.value = String(i);
        o.textContent = list[i].n;
        og.appendChild(o);
      });
      select.insertBefore(og, other);
    });
  }

  /* Общий разброс цены заявки по всем нишам */
  function spread() {
    var list = window.NICHES || [];
    if (!list.length) return { lo: 0, hi: 0 };
    return {
      lo: Math.min.apply(null, list.map(function (n) { return n.lo; })),
      hi: Math.max.apply(null, list.map(function (n) { return n.hi; }))
    };
  }

  window.NicheSelect = { fill: fill, spread: spread };
})();
