// Arrange mode for the Projects card table. Open projects.html?arrange to use it.
// Drag anything on the table to move it, scroll over it to resize, shift+scroll to rotate,
// double-click to take it off the table. "Copy layout" copies the arrangement so it can be
// made permanent.
(function () {
  if (!/[?&]arrange\b/.test(location.search)) return;
  window.__arranging = true;
  sessionStorage.setItem('sg-pool-done', '1');
  var KEY = 'sg-arrange-v1', saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}

  var css = `
    #table,#cardframe{pointer-events:auto !important}
    .arr-item{cursor:move !important;pointer-events:auto !important}
    .arr-item:hover{outline:2px dashed rgba(255,240,200,.85);outline-offset:4px}
    .arr-item.arr-off{opacity:.18 !important}
    .arr-item.arr-on{outline:2px solid #f3d38a;outline-offset:4px}
    #arrPanel{position:fixed;left:16px;bottom:16px;z-index:9999;background:#fbf6ee;color:#2b2620;border-radius:10px;padding:12px 14px;
      font:13px/1.45 'Inter',Courier,monospace;box-shadow:0 14px 30px rgba(0,0,0,.45);max-width:340px}
    #arrPanel b{font-family:'Reenie Beanie',cursive;font-size:24px;font-weight:400;color:#24306b;display:block;margin-bottom:4px}
    #arrPanel button{font:13px 'Inter',monospace;margin:8px 6px 0 0;padding:5px 10px;border-radius:6px;border:1px solid #b9ab8a;background:#fff;cursor:pointer}
    #arrPanel button.main{background:#24306b;color:#fff;border-color:#24306b}
    #arrPanel textarea{width:100%;height:90px;margin-top:8px;font:11px Inter,sans-serif;display:none}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function items() {
    var list = [];
    document.querySelectorAll('#table .pc').forEach(function (e, i) { if (e.style.display !== 'none') list.push([e, 'pc' + i]); });
    document.querySelectorAll('#cardframe .fc').forEach(function (e, i) { if (e.style.display !== 'none' && e.isConnected) list.push([e, 'fc' + i]); });
    var p = document.querySelector('.poster-card'); if (p) list.push([p, 'poster']);
    var d = document.querySelector('.deck-wrap'); if (d) list.push([d, 'deck']);
    return list;
  }
  function state(e) { return e.__arr || (e.__arr = { dx: 0, dy: 0, s: 1, r: 0, off: false }); }
  function apply(e) { var a = state(e); e.style.translate = a.dx + 'px ' + a.dy + 'px'; e.style.scale = a.s; e.style.rotate = a.r + 'deg'; e.classList.toggle('arr-off', a.off); }
  function save() { var o = {}; items().forEach(function (p) { o[p[1]] = state(p[0]); }); localStorage.setItem(KEY, JSON.stringify(o)); }

  function setup() {
    items().forEach(function (pair) {
      var e = pair[0], id = pair[1]; e.classList.add('arr-item'); e.dataset.arrId = id;
      if (saved[id]) { e.__arr = saved[id]; apply(e); }
      var start = null;
      e.addEventListener('pointerdown', function (ev) { if (ev.button !== 0) return; ev.preventDefault(); ev.stopPropagation();
        var a = state(e); start = { x: ev.clientX, y: ev.clientY, dx: a.dx, dy: a.dy }; e.setPointerCapture(ev.pointerId); e.classList.add('arr-on');
        e.parentNode.appendChild(e); }, true);
      e.addEventListener('pointermove', function (ev) { if (!start) return; var a = state(e); a.dx = start.dx + ev.clientX - start.x; a.dy = start.dy + ev.clientY - start.y; apply(e); });
      e.addEventListener('pointerup', function () { if (!start) return; start = null; e.classList.remove('arr-on'); save(); });
      e.addEventListener('wheel', function (ev) { ev.preventDefault(); var a = state(e);
        if (ev.shiftKey) a.r += (ev.deltaY || ev.deltaX) > 0 ? 3 : -3; else a.s = Math.max(.25, Math.min(4, a.s * (ev.deltaY > 0 ? .95 : 1.05)));
        apply(e); save(); }, { passive: false });
      e.addEventListener('dblclick', function (ev) { ev.preventDefault(); var a = state(e); a.off = !a.off; apply(e); save(); });
      e.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); }, true);
    });
  }

  // the arrangement, written as absolute positions so it can be rebuilt exactly
  function exportLayout() {
    var W = document.documentElement.clientWidth, out = { width: W, height: document.documentElement.scrollHeight, items: [] };
    items().forEach(function (pair) {
      var e = pair[0], a = state(e), r = e.getBoundingClientRect();
      var m = /rotate\((-?[\d.]+)deg\)/.exec(e.style.transform || ''), base = 0;
      if (m) base = parseFloat(m[1]); else { var t = getComputedStyle(e).transform; if (t && t !== 'none') { var v = t.match(/-?[\d.e]+/g).map(Number); base = Math.atan2(v[1], v[0]) * 180 / Math.PI; } }
      out.items.push({ id: pair[1], what: e.dataset.spec ? JSON.parse(e.dataset.spec) : (e.dataset.card || pair[1]),
        cx: +((r.left + r.width / 2) / W * 100).toFixed(2), cy: Math.round(r.top + scrollY + r.height / 2),
        w: Math.round(e.offsetWidth * a.s), rot: +(parseFloat(base) + a.r).toFixed(1), removed: a.off });
    });
    return JSON.stringify(out);
  }

  var panel = document.createElement('div'); panel.id = 'arrPanel';
  panel.innerHTML = '<b>arrange the table</b>drag to move · scroll to resize · shift + scroll to rotate · double-click to take off the table' +
    '<br><button class="main" id="arrCopy">copy layout</button><button id="arrReset">reset</button><button id="arrExit">exit</button><textarea id="arrOut" readonly></textarea>';
  function init() {
    document.body.appendChild(panel); setup();
    panel.querySelector('#arrCopy').onclick = function () { var t = exportLayout(), ta = panel.querySelector('#arrOut'); ta.value = t; ta.style.display = 'block'; ta.select();
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { panel.querySelector('#arrCopy').textContent = 'copied!'; }, function () { document.execCommand('copy'); }); };
    panel.querySelector('#arrReset').onclick = function () { localStorage.removeItem(KEY); location.reload(); };
    panel.querySelector('#arrExit').onclick = function () { location.href = location.pathname; };
  }
  if (document.readyState === 'complete') setTimeout(init, 300); else addEventListener('load', function () { setTimeout(init, 300); });
})();
