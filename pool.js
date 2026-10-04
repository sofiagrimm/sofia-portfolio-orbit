// Opening for the Projects page. A screen-printed pool table: pull the cue back and let go.
// The 8 ball smashes the rack (the balls spell "sofia grimm"), then the camera follows it
// down the length of the table, off a cushion, over the end rail and onto the red card table,
// where the camera settles and the ball rolls on out of frame. About fifteen seconds.
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || sessionStorage.getItem('sg-pool-done') || /[?&]arrange\b/.test(location.search)) return;

  var css = `
  #pool{position:fixed;inset:0;z-index:500;overflow:hidden;touch-action:none;cursor:grab;-webkit-user-select:none;user-select:none;outline:none}
  #pool.aiming{cursor:grabbing}
  #pool .world{position:absolute;left:0;top:0;will-change:transform}
  #pool .world svg{display:block}
  #pool .grain{position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:multiply;transition:opacity 1.2s;
    background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .1  0 0 0 0 .18  0 0 0 0 .12  0 0 0 1.2 -.35'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")}
  #pool .lamp{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(255,236,190,.16),transparent 70%),radial-gradient(ellipse 120% 100% at 50% 50%,transparent 55%,rgba(0,0,0,.45) 100%);transition:opacity 1.2s}
  #pool .flash{position:absolute;inset:0;pointer-events:none;background:#fff8e6;opacity:0}
  #pool .prompt{position:absolute;font-family:'Nanum Pen Script',cursive;color:#f6ecd6;font-size:clamp(26px,3vw,38px);line-height:1;pointer-events:none;text-shadow:2px 2px 0 rgba(20,40,25,.5);transition:opacity .4s}
  #pool .prompt b{font-family:'DM Serif Display',Georgia,serif;font-style:italic;font-weight:400;display:block;font-size:1.5em;color:#f3d38a;margin-bottom:6px}
  #pool .skip{position:absolute;right:clamp(18px,3vw,36px);bottom:clamp(18px,3vw,36px);font:13px 'Courier Prime',Courier,monospace;color:#f6ecd6;background:rgba(20,40,25,.45);border:1px solid rgba(246,236,214,.5);border-radius:999px;padding:6px 14px;cursor:pointer;z-index:2}
  #pool .skip:hover,#pool .skip:focus-visible{background:rgba(20,40,25,.7);outline:none}
  html.pool-moving body > *:not(#pool){translate:var(--pool-dx,0px) var(--pool-dy,0px)}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var NS = 'http://www.w3.org/2000/svg';
  var pool = document.createElement('div'); pool.id = 'pool'; pool.tabIndex = 0;
  pool.setAttribute('role', 'dialog'); pool.setAttribute('aria-label', 'Opening: break the rack to get to the card table');
  pool.innerHTML = '<div class="world"><svg></svg></div><div class="lamp"></div><div class="grain"></div><div class="flash"></div>' +
    '<p class="prompt"><b>break the rack.</b>pull the cue back,<br>then let go</p><button class="skip" type="button">skip</button>';
  document.body.appendChild(pool);
  document.documentElement.style.overflow = 'hidden';
  var world = pool.querySelector('.world'), svg = world.querySelector('svg'), prompt = pool.querySelector('.prompt'), flash = pool.querySelector('.flash');

  var W, H, land, SU, SV, R, END, balls = [], eight, cue, rack, trail = [], trailEls = [], dir, pull = 0, state = 'aim';
  var RED = '#cf4a3c', BLUE = '#6aa8d8', CREAM = '#f1e6cf', INK = '#1e1d1f', FELT = '#3d8a55', FELT2 = '#2f7446', WOOD = '#6b3f22', WOOD2 = '#4a2a16', GOLD = '#e2c27e';
  var LETTERS = ['s', 'o', 'f', 'i', 'a', 'g', 'r', 'i', 'm', 'm'];
  // travel runs along u: left-to-right on a wide screen, top-to-bottom on a tall one
  var P = function (u, v) { return land ? { x: u, y: v } : { x: v, y: u }; };
  var el = function (tag, a, parent) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; };

  // ── sound: made in the browser, only after the player has clicked
  var audio = { c: null,
    init: function () { try { this.c = this.c || new (window.AudioContext || window.webkitAudioContext)(); if (this.c.state === 'suspended') this.c.resume(); } catch (e) {} },
    noise: function (dur, f, q, gain, type) { var c = this.c; if (!c) return; var n = Math.ceil(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * dur * .25));
      var s = c.createBufferSource(); s.buffer = b; var fl = c.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q; var g = c.createGain(); g.gain.value = gain;
      s.connect(fl).connect(g).connect(c.destination); s.start(); },
    tone: function (f, dur, gain, type) { var c = this.c; if (!c) return; var o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .7, t + dur);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur); o.connect(g).connect(c.destination); o.start(); o.stop(t + dur + .02); },
    clack: function (v) { v = Math.max(.15, Math.min(1, v)); this.noise(.04, 3000 + Math.random() * 900, 1.3, .5 * v); this.tone(1700 + Math.random() * 400, .06, .08 * v); this.tone(380, .05, .1 * v, 'triangle'); },
    cue: function () { this.noise(.05, 1400, 1, .5); this.tone(220, .08, .2, 'triangle'); },
    thump: function () { this.tone(110, .25, .35, 'sine'); this.noise(.08, 400, .7, .3, 'lowpass'); },
    rumble: null,
    roll: function (on) { var c = this.c; if (!c) return; if (on && !this.rumble) { var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; var s = c.createBufferSource(); s.buffer = b; s.loop = true; var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
        var g = c.createGain(); g.gain.value = 0; s.connect(f).connect(g).connect(c.destination); s.start(); this.rumble = { s: s, g: g }; }
      if (!on && this.rumble) { var r = this.rumble; r.g.gain.setTargetAtTime(0, c.currentTime, .15); setTimeout(function () { try { r.s.stop(); } catch (e) {} }, 800); this.rumble = null; } },
    level: function (v) { if (this.rumble) this.rumble.g.gain.setTargetAtTime(Math.min(.22, v), this.c.currentTime, .05); }
  };

  function defs() {
    var d = el('defs', {});
    d.innerHTML = '<filter id="pSpeck" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="3"/>' +
      '<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.6 1.5"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<linearGradient id="pWood" x1="0" y1="0" x2="' + (land ? 0 : 1) + '" y2="' + (land ? 1 : 0) + '"><stop offset="0" stop-color="#7d4a28"/><stop offset=".5" stop-color="' + WOOD + '"/><stop offset="1" stop-color="' + WOOD2 + '"/></linearGradient>' +
      '<radialGradient id="pShine" cx="35%" cy="30%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></radialGradient>';
  }

  function makeBall(i, letter) {
    var g = el('g', {}), kind = i < 0 ? 'eight' : ['red', 'blue', 'redStripe', 'blueStripe'][i % 4], col = kind.indexOf('red') === 0 ? RED : BLUE;
    var sh = el('ellipse', { cx: R * .3, cy: R * .38, rx: R, ry: R * .92, fill: '#123020', opacity: '.6' }, g);
    var body = el('g', {}, g), spin = el('g', {}, body);
    var cp = el('clipPath', { id: 'pc' + i }, svg.querySelector('defs')); el('circle', { r: R }, cp);
    if (kind === 'eight') el('circle', { r: R, fill: INK }, spin);
    else if (kind.indexOf('Stripe') > 0) { el('circle', { r: R, fill: CREAM }, spin); el('rect', { x: -R, y: -R * .52, width: R * 2, height: R * 1.04, fill: col, 'clip-path': 'url(#pc' + i + ')' }, spin); }
    else el('circle', { r: R, fill: col }, spin);
    el('circle', { r: R, fill: '#fff', filter: 'url(#pSpeck)', opacity: '.33' }, spin);
    el('circle', { r: R * .48, fill: CREAM }, spin);
    var t = el('text', { 'text-anchor': 'middle', y: R * .21, 'font-family': "'DM Serif Display',Georgia,serif", 'font-size': R * .64, fill: INK }, spin); t.textContent = kind === 'eight' ? '8' : letter;
    el('circle', { r: R, fill: 'url(#pShine)' }, body);
    return { g: g, sh: sh, body: body, spin: spin, x: 0, y: 0, vx: 0, vy: 0, a: 0, lift: 0, eight: kind === 'eight' };
  }

  function rectUV(u0, v0, du, dv, attrs) { var a = P(u0, v0), b = P(u0 + du, v0 + dv); attrs.x = Math.min(a.x, b.x); attrs.y = Math.min(a.y, b.y); attrs.width = Math.abs(b.x - a.x); attrs.height = Math.abs(b.y - a.y); return el('rect', attrs); }

  function drawTable() {
    // the pool table runs three screens long; past its foot rail the world is empty,
    // so the real card table (the Projects page) shows through
    var rail = R * 2.1, cush = R * .45;
    rectUV(0, 0, END, SV, { fill: FELT });
    rectUV(0, SV * .2, END, SV * .6, { fill: '#4a9a62', opacity: '.22' });
    rectUV(0, 0, END, rail, { fill: 'url(#pWood)' }); rectUV(0, SV - rail, END, rail, { fill: 'url(#pWood)' });
    rectUV(0, 0, rail, SV, { fill: 'url(#pWood)' }); rectUV(END - rail, 0, rail, SV, { fill: 'url(#pWood)' });
    rectUV(rail, rail, END - 2 * rail, cush, { fill: FELT2 }); rectUV(rail, SV - rail - cush, END - 2 * rail, cush, { fill: FELT2 });
    rectUV(rail, rail, cush, SV - 2 * rail, { fill: FELT2 }); rectUV(END - rail - cush, rail, cush, SV - 2 * rail, { fill: FELT2 });
    // a dark lip where the cloth meets the foot rail, so the hop reads
    rectUV(END - rail - cush - R * .2, rail, R * .2, SV - 2 * rail, { fill: '#1f4d30', opacity: '.6' });
    for (var k = 1; k < 12; k++) { if (k % 4 === 0) continue; [rail * .5, SV - rail * .5].forEach(function (v) { var p = P(k * END / 12, v), s = R * .2;
      el('path', { d: 'M' + (p.x - s) + ' ' + p.y + ' L' + p.x + ' ' + (p.y - s) + ' L' + (p.x + s) + ' ' + p.y + ' L' + p.x + ' ' + (p.y + s) + 'Z', fill: CREAM, opacity: '.85' }); }); }
    [[rail * .55, rail * .55], [END / 2, rail * .4], [END - rail * .55, rail * .55], [rail * .55, SV - rail * .55], [END / 2, SV - rail * .4], [END - rail * .55, SV - rail * .55]].forEach(function (q) { var p = P(q[0], q[1]); el('circle', { cx: p.x, cy: p.y, r: R * 1.15, fill: '#0f0f10' }); });
    var h0 = P(SU * .78, rail), h1 = P(SU * .78, SV - rail); el('line', { x1: h0.x, y1: h0.y, x2: h1.x, y2: h1.y, stroke: CREAM, 'stroke-width': 1.5, opacity: '.25', 'stroke-dasharray': '6 8' });
    var cap = function (u, v, txt, size, font, fill, rot, op) { var p = P(u, v), t = el('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'font-family': font, 'font-size': size, fill: fill, opacity: op, transform: 'rotate(' + rot + ' ' + p.x + ' ' + p.y + ')' }); t.textContent = txt; };
    var m = Math.min(SU, SV);
    cap(SU * 1.3, SV * .76, 'sofia grimm\u2019s card table', m * .085, "'DM Serif Display',Georgia,serif", GOLD, -4, .42);
    cap(SU * 2.35, SV * .3, 'this way to the cards', m * .07, "'Nanum Pen Script',cursive", CREAM, -6, .55);
    var a0 = P(SU * 2.62, SV * .4), a1 = P(SU * 2.84, SV * .4), hs = m * .025;
    el('path', { d: 'M' + a0.x + ' ' + a0.y + ' L' + a1.x + ' ' + a1.y, stroke: CREAM, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: '.55' });
    var hp = land ? 'M' + (a1.x - hs) + ' ' + (a1.y - hs) + ' L' + a1.x + ' ' + a1.y + ' L' + (a1.x - hs) + ' ' + (a1.y + hs) : 'M' + (a1.x - hs) + ' ' + (a1.y - hs) + ' L' + a1.x + ' ' + a1.y + ' L' + (a1.x + hs) + ' ' + (a1.y - hs);
    el('path', { d: hp, fill: 'none', stroke: CREAM, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: '.55' });
  }

  function props() {
    var s = Math.min(SU, SV) / 900, g = el('g', {});
    var put = function (u, v, rot, html) { var p = P(u, v), e = el('g', { transform: 'translate(' + p.x + ' ' + p.y + ') rotate(' + rot + ') scale(' + s + ')' }, g); e.innerHTML = html; };
    var spk = function (w, h, r) { return '<rect width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" fill="#fff" filter="url(#pSpeck)" opacity=".38"/>'; };
    put(SU * .1, SV * .16, -12, '<rect x="6" y="8" width="150" height="190" fill="#123020" opacity=".55"/><rect width="150" height="190" fill="' + CREAM + '"/><rect y="150" width="150" height="40" fill="' + INK + '"/>' +
      '<text x="75" y="70" text-anchor="middle" font-family="\'DM Serif Display\',Georgia,serif" font-size="54" fill="#2f7a4a">sg</text><text x="75" y="98" text-anchor="middle" font-family="Courier New,monospace" font-size="12" font-weight="700" fill="#2f7a4a">CARD TABLE &amp;</text>' +
      '<text x="75" y="114" text-anchor="middle" font-family="Courier New,monospace" font-size="12" font-weight="700" fill="#2f7a4a">POOL LOUNGE</text><text x="75" y="140" text-anchor="middle" font-family="Courier New,monospace" font-size="9" fill="#2f7a4a">OPEN LATE · NEW HAVEN</text>' + spk(150, 190));
    put(SU * .9, SV * .14, 7, '<rect x="8" y="10" width="220" height="200" fill="#123020" opacity=".55"/><rect width="220" height="200" fill="' + CREAM + '"/><path d="M70 40 q20 -14 40 0 q20 -14 40 0 q-20 18 -40 10 q-20 8 -40 -10z" fill="' + RED + '" opacity=".85"/>' +
      '<text x="110" y="92" text-anchor="middle" font-family="\'Nanum Pen Script\',cursive" font-size="30" fill="' + INK + '">the card table</text><text x="110" y="126" text-anchor="middle" font-family="\'Nanum Pen Script\',cursive" font-size="26" fill="' + INK + '">new haven, ct</text>' +
      '<text x="110" y="158" text-anchor="middle" font-family="\'Nanum Pen Script\',cursive" font-size="26" fill="' + INK + '">sofiagrimm.com</text>' + spk(220, 200));
    var die = function (u, v, rot, pips) { var h = '<rect x="5" y="6" width="56" height="56" rx="8" fill="#123020" opacity=".55"/><rect width="56" height="56" rx="8" fill="' + CREAM + '"/>'; pips.forEach(function (q) { h += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="5.5" fill="' + INK + '"/>'; }); put(u, v, rot, h + spk(56, 56, 8)); };
    die(SU * 1.05, SV * .84, 14, [[28, 28]]); die(SU * 1.12, SV * .76, -10, [[16, 14], [40, 14], [16, 28], [40, 28], [16, 42], [40, 42]]);
    put(SU * .2, SV * .78, 18, '<rect x="5" y="6" width="54" height="54" fill="#123020" opacity=".55"/><rect width="54" height="54" fill="' + BLUE + '"/><rect x="10" y="10" width="34" height="34" fill="#4c86b8"/>' + spk(54, 54));
    put(SU * 1.95, SV * .82, 0, '<circle cx="8" cy="10" r="66" fill="#123020" opacity=".55"/><circle r="66" fill="' + CREAM + '"/><text y="14" text-anchor="middle" font-family="\'DM Serif Display\',Georgia,serif" font-size="40" fill="' + RED + '">cards</text>');
    var c0 = P(SU * 1.75, SV * .18), c1 = P(SU * 2.55, SV * .24);
    el('line', { x1: c0.x + 6, y1: c0.y + 8, x2: c1.x + 6, y2: c1.y + 8, stroke: '#123020', 'stroke-width': R * .55, 'stroke-linecap': 'round', opacity: '.5' }, g);
    el('line', { x1: c0.x, y1: c0.y, x2: c1.x, y2: c1.y, stroke: '#c99b5e', 'stroke-width': R * .45, 'stroke-linecap': 'round' }, g);
    el('line', { x1: c0.x, y1: c0.y, x2: c0.x + (c1.x - c0.x) * .3, y2: c0.y + (c1.y - c0.y) * .3, stroke: '#7a4a2a', 'stroke-width': R * .55, 'stroke-linecap': 'round' }, g);
  }

  var cam = { u: 0, shake: 0 };
  function build() {
    W = innerWidth; H = innerHeight; land = W >= H; SU = land ? W : H; SV = land ? H : W; END = 3 * SU;
    R = Math.min(W, H) * (land ? .03 : .042);
    var ww = land ? 4.6 * SU : SV, wh = land ? SV : 4.6 * SU;
    svg.setAttribute('width', ww); svg.setAttribute('height', wh); svg.setAttribute('viewBox', '0 0 ' + ww + ' ' + wh); svg.innerHTML = '';
    defs(); drawTable(); props();
    var apexU = SU * .56, midV = SV * .5, gap = R * 2.02, pos = [];
    [1, 2, 3, 4].forEach(function (n, r) { for (var k = 0; k < n; k++) pos.push(P(apexU + r * gap * .87, midV + (k - (n - 1) / 2) * gap)); });
    var c1 = P(apexU - R * 1.7, midV), back = apexU + 3 * gap * .87 + R * 1.5, half = 1.5 * gap + R * 1.7, c2 = P(back, midV + half), c3 = P(back, midV - half);
    rack = el('g', {});
    var tri = 'M' + c1.x + ' ' + c1.y + ' L' + c2.x + ' ' + c2.y + ' L' + c3.x + ' ' + c3.y + 'Z';
    el('path', { d: tri, fill: 'none', stroke: '#123020', 'stroke-width': R * .9, 'stroke-linejoin': 'round', opacity: '.55', transform: 'translate(' + R * .25 + ' ' + R * .3 + ')' }, rack);
    el('path', { d: tri, fill: 'none', stroke: INK, 'stroke-width': R * .75, 'stroke-linejoin': 'round' }, rack);
    el('path', { d: tri, fill: 'none', stroke: CREAM, 'stroke-width': R * .16, 'stroke-linejoin': 'round', opacity: '.75', 'stroke-dasharray': R * .9 + ' ' + R * .25 }, rack);
    trailEls = []; for (var t = 0; t < 10; t++) trailEls.push(el('circle', { r: R * (1 - t * .06), fill: INK, opacity: 0 }));
    balls = LETTERS.map(function (l, i) { var b = makeBall(i, l); b.x = pos[i].x; b.y = pos[i].y; return b; });
    eight = makeBall(-1); var e0 = P(SU * .25, midV); eight.x = e0.x; eight.y = e0.y; balls.push(eight);
    dir = land ? { x: 1, y: 0 } : { x: 0, y: 1 };
    cue = el('g', {}); var L = Math.max(W, H) * .7;
    el('rect', { x: -L, y: -R * .32 + R * .3, width: L, height: R * .64, fill: '#123020', opacity: '.55', transform: 'translate(' + R * .2 + ' 0)' }, cue);
    el('rect', { x: -L, y: -R * .26, width: L, height: R * .52, rx: R * .26, fill: '#c99b5e' }, cue);
    el('rect', { x: -L, y: -R * .34, width: L * .35, height: R * .68, rx: R * .34, fill: '#7a4a2a' }, cue);
    el('rect', { x: -R * .9, y: -R * .26, width: R * .9, height: R * .52, fill: CREAM }, cue);
    el('rect', { x: -R * .25, y: -R * .26, width: R * .25, height: R * .52, rx: R * .1, fill: BLUE }, cue);
    var pp = land ? { left: eight.x - W * .2, top: eight.y + R * 2.4 } : { left: W * .08, top: eight.y + R * 2.4 };
    prompt.style.left = pp.left + 'px'; prompt.style.top = pp.top + 'px';
    cam = { u: 0, shake: 0 }; setCamera(); draw();
  }

  function setCamera() {
    var sx = (Math.random() - .5) * cam.shake, sy = (Math.random() - .5) * cam.shake, off = P(-cam.u, 0);
    world.style.transform = 'translate(' + (off.x + sx) + 'px,' + (off.y + sy) + 'px)';
    // the real page sits just past the foot rail and slides in with the camera
    var pd = P(END - cam.u, 0);
    document.documentElement.style.setProperty('--pool-dx', (pd.x + sx) + 'px'); document.documentElement.style.setProperty('--pool-dy', (pd.y + sy) + 'px');
  }

  function draw() {
    balls.forEach(function (b) {
      b.g.setAttribute('transform', 'translate(' + b.x + ' ' + b.y + ')');
      b.body.setAttribute('transform', 'translate(0 ' + (-b.lift * R * 1.3) + ') scale(' + (1 + b.lift * .35) + ')');
      b.sh.setAttribute('transform', 'scale(' + (1 - b.lift * .25) + ')'); b.sh.setAttribute('opacity', .6 - b.lift * .3);
      b.spin.setAttribute('transform', 'rotate(' + b.a + ')');
    });
    trailEls.forEach(function (t, i) { var p = trail[trail.length - 1 - (i + 1) * 2]; if (!p) { t.setAttribute('opacity', 0); return; }
      t.setAttribute('cx', p.x); t.setAttribute('cy', p.y); t.setAttribute('opacity', Math.max(0, .22 - i * .022) * Math.min(1, p.s / (R * .5))); });
    var back = R + 6 + pull;
    if (cue) cue.setAttribute('transform', 'translate(' + (eight.x - dir.x * back) + ' ' + (eight.y - dir.y * back) + ') rotate(' + (land ? 0 : 90) + ')');
  }

  var dragFrom = null, maxPull;
  pool.addEventListener('pointerdown', function (e) {
    audio.init();
    if (state !== 'aim' || e.target.classList.contains('skip')) return;
    dragFrom = { x: e.clientX, y: e.clientY }; maxPull = Math.min(W, H) * .2; pool.classList.add('aiming'); pool.setPointerCapture(e.pointerId);
  });
  pool.addEventListener('pointermove', function (e) { if (!dragFrom) return; var dx = e.clientX - dragFrom.x, dy = e.clientY - dragFrom.y; pull = Math.max(0, Math.min(maxPull, -(dx * dir.x + dy * dir.y) + Math.hypot(dx, dy) * .35)); draw(); });
  pool.addEventListener('pointerup', function () { if (!dragFrom) return; dragFrom = null; pool.classList.remove('aiming'); shoot(Math.max(.5, pull / maxPull)); });
  pool.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && state === 'aim') { e.preventDefault(); audio.init(); shoot(.8); } });

  function shoot(power) {
    if (state !== 'aim') return; state = 'strike'; prompt.style.opacity = 0;
    var from = pull, t0 = performance.now();
    (function thrust(now) {
      var k = Math.min(1, (now - t0) / 110); pull = from * (1 - k) - R * .2 * k; draw();
      if (k < 1) return requestAnimationFrame(thrust);
      audio.cue();
      var sp = Math.min(W, H) * .05 * (.6 + power); eight.vx = dir.x * sp; eight.vy = dir.y * sp; state = 'break';
      cue.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 200, fill: 'forwards' });
      physics();
    })(t0);
  }

  var impactAt = 0, slow = 1;
  function burst(x, y) {
    flash.animate([{ opacity: .55 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' });
    var ring = el('circle', { cx: x, cy: y, r: R, fill: 'none', stroke: '#fff8e6', 'stroke-width': 4 });
    ring.animate([{ transform: 'scale(1)', opacity: .9 }, { transform: 'scale(7)', opacity: 0 }], { duration: 700, easing: 'ease-out', fill: 'forwards' });
    ring.style.transformOrigin = x + 'px ' + y + 'px'; ring.style.transformBox = 'view-box';
    for (var i = 0; i < 22; i++) { var a = Math.random() * 6.28, d = R * (2 + Math.random() * 5), p = el('circle', { cx: x, cy: y, r: R * (.07 + Math.random() * .14), fill: i % 3 ? BLUE : CREAM, opacity: .9 });
      p.animate([{ transform: 'translate(0,0)', opacity: .9 }, { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px)', opacity: 0 }], { duration: 700 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }); }
    rack.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
  }

  function physics() {
    var last = performance.now(), wall = R * 2.1 + R * .45 + R;
    (function step(now) {
      var dt = Math.min(2, (now - last) / 16.7) * slow; last = now;
      for (var sub = 0; sub < 6; sub++) {
        balls.forEach(function (b) {
          if (b === eight && state === 'cruise') return;
          b.x += b.vx * dt / 6; b.y += b.vy * dt / 6; var f = Math.pow(.9965, dt / 6); b.vx *= f; b.vy *= f; b.a += Math.hypot(b.vx, b.vy) * dt / 6 / R * 57.3;
          var minX = wall, minY = wall, maxX = land ? END - wall : SV - wall, maxY = land ? SV - wall : END - wall;
          if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx) * .75; } if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * .75; }
          if (b.y < minY) { b.y = minY; b.vy = Math.abs(b.vy) * .75; } if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy) * .75; }
        });
        for (var i = 0; i < balls.length; i++) for (var j = i + 1; j < balls.length; j++) {
          var A = balls[i], B = balls[j]; if ((A === eight || B === eight) && state === 'cruise') continue;
          var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
          if (d > 0 && d < 2 * R) {
            var nx = dx / d, ny = dy / d, over = (2 * R - d) / 2; A.x -= nx * over; A.y -= ny * over; B.x += nx * over; B.y += ny * over;
            var rel = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny;
            if (rel > 0) { A.vx -= rel * nx * .96; A.vy -= rel * ny * .96; B.vx += rel * nx * .96; B.vy += rel * ny * .96;
              audio.clack(rel / (R * .8));
              if (!impactAt) { impactAt = now; burst((A.x + B.x) / 2, (A.y + B.y) / 2); cam.shake = R * .7; slow = .25; } }
          }
        }
      }
      if (impactAt) { var since = now - impactAt; if (since > 550) slow = Math.min(1, slow + .03); cam.shake *= .9; if (since > 1200 && state === 'break') cruise(now); }
      trail.push({ x: eight.x, y: eight.y, s: Math.hypot(eight.vx, eight.vy) || trailSpeed }); if (trail.length > 30) trail.shift();
      if (state === 'cruise') cruiseStep(now);
      setCamera(); draw();
      if (state !== 'gone') requestAnimationFrame(step);
    })(performance.now());
  }

  // after the break the camera follows the 8 ball: off the near cushion, the length of
  // the table, over the foot rail and onto the card table, then the ball rolls away
  var path, legs, legIdx = 0, legT0 = 0, bounced = false, landed = false, trailSpeed = 0;
  function cruise(now) {
    state = 'cruise'; audio.roll(true);
    var wall = R * 2.1 + R * .45 + R, b0 = land ? { u: eight.x, v: eight.y } : { u: eight.y, v: eight.x };
    path = [b0, { u: SU * 1.6, v: wall }, { u: END - R * 2.8, v: SV * .6 }, { u: END + SU * .32, v: SV * .64 }, { u: END + SU * 1.5, v: SV * .7 }];
    legs = [{ d: 3000, e: 'out' }, { d: 4300, e: 'lin' }, { d: 1400, e: 'hop' }, { d: 2600, e: 'lin' }];
    legIdx = 0; legT0 = now;
  }
  function cruiseStep(now) {
    var leg = legs[legIdx], t = Math.min(1, (now - legT0) / leg.d), a = path[legIdx], b = path[legIdx + 1];
    var k = leg.e === 'out' ? 1 - Math.pow(1 - t, 1.5) : t;
    var u = a.u + (b.u - a.u) * k, v = a.v + (b.v - a.v) * k, q = P(u, v), sp = Math.hypot(q.x - eight.x, q.y - eight.y);
    trailSpeed = sp; eight.a += sp / R * 57.3; eight.x = q.x; eight.y = q.y;
    eight.lift = leg.e === 'hop' && t < .82 ? Math.sin(Math.PI * t / .82) : 0;
    audio.level(sp * .012 * (eight.lift > .1 ? .15 : 1));
    cam.u += (Math.max(0, Math.min(END, u - SU * .42)) - cam.u) * .055;
    if (legIdx === 0 && t >= 1 && !bounced) { bounced = true; audio.clack(.6); cam.shake = R * .15; }
    if (legIdx === 2 && t > .82 && !landed) { landed = true; audio.thump(); cam.shake = R * .3;
      pool.querySelector('.lamp').style.opacity = 0; pool.querySelector('.grain').style.opacity = 0; }
    if (t >= 1) { legIdx++; legT0 = now; if (legIdx >= legs.length) finish(); }
  }

  function cleanup() {
    document.documentElement.classList.remove('pool-moving'); document.documentElement.style.removeProperty('--pool-dx'); document.documentElement.style.removeProperty('--pool-dy');
    document.documentElement.style.overflow = ''; pool.remove(); st.remove();
    dispatchEvent(new Event('resize'));
  }
  function finish() {
    if (state === 'gone') return; state = 'gone'; audio.roll(false); sessionStorage.setItem('sg-pool-done', '1');
    cam.u = END; setCamera();
    pool.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }).finished.then(cleanup);
  }
  pool.querySelector('.skip').addEventListener('click', function () {
    state = 'gone'; audio.roll(false); sessionStorage.setItem('sg-pool-done', '1');
    pool.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(cleanup);
  });

  document.documentElement.classList.add('pool-moving');
  build(); pool.focus();
  addEventListener('resize', function () { if (state === 'aim') build(); });
})();
