// Opening for the Projects page: a screen-printed pool table. Pull the cue back, let go,
// the 8 ball breaks the rack (the balls spell "sofia grimm") and rolls on, opening a hole
// in the felt that reveals the card table underneath.
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || sessionStorage.getItem('sg-pool-done')) return;

  var css = `
  #pool{position:fixed;inset:0;z-index:500;background:#3d8a55;overflow:hidden;touch-action:none;cursor:grab;-webkit-user-select:none;user-select:none}
  #pool.aiming{cursor:grabbing}
  #pool svg.table{position:absolute;inset:0;width:100%;height:100%}
  #pool .grain{position:absolute;inset:0;pointer-events:none;opacity:.55;mix-blend-mode:multiply;
    background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .1  0 0 0 0 .2  0 0 0 0 .12  0 0 0 1.2 -.35'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")}
  #pool .frame{position:absolute;inset:0;pointer-events:none;border:clamp(10px,1.6vw,18px) solid #f1e6cf}
  #pool .prompt{position:absolute;font-family:'Nanum Pen Script',cursive;color:#f6ecd6;font-size:clamp(24px,3vw,36px);line-height:1;pointer-events:none;
    text-shadow:2px 2px 0 rgba(20,40,25,.5);transition:opacity .4s}
  #pool .skip{position:absolute;right:clamp(22px,3vw,40px);bottom:clamp(22px,3vw,40px);font:13px 'Courier Prime',Courier,monospace;color:#f6ecd6;
    background:rgba(20,40,25,.35);border:1px solid rgba(246,236,214,.5);border-radius:999px;padding:6px 14px;cursor:pointer}
  #pool .skip:hover,#pool .skip:focus-visible{background:rgba(20,40,25,.6);outline:none}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var NS = 'http://www.w3.org/2000/svg';
  var pool = document.createElement('div'); pool.id = 'pool';
  pool.setAttribute('role', 'dialog'); pool.setAttribute('aria-label', 'Opening: break the rack to see the projects');
  pool.innerHTML = '<svg class="table" aria-hidden="true"></svg><div class="grain"></div><div class="frame"></div>' +
    '<p class="prompt" id="poolPrompt">pull the cue back,<br>then let go to break</p><button class="skip" type="button">skip</button>';
  document.body.appendChild(pool);
  document.documentElement.style.overflow = 'hidden';
  var svg = pool.querySelector('svg.table'), prompt = pool.querySelector('#poolPrompt');

  var W, H, R, balls = [], cue, rack, props, landscape, tip = { x: 0, y: 0 }, dir = { x: 1, y: 0 }, pull = 0, state = 'aim';
  var RED = '#cf4a3c', BLUE = '#6aa8d8', CREAM = '#f1e6cf', INK = '#1e1d1f';
  var LETTERS = ['s', 'o', 'f', 'i', 'a', 'g', 'r', 'i', 'm', 'm'];

  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; }

  function defs() {
    var d = el('defs', {});
    // a speckled "print" texture for the balls and props
    d.innerHTML =
      '<filter id="speck" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="3"/>' +
      '<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.6 1.5"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<clipPath id="ballClip"><circle r="1"/></clipPath>';
  }

  function makeBall(i, letter) {
    var g = el('g', {});
    var kind = i < 0 ? 'eight' : ['red', 'blue', 'redStripe', 'blueStripe'][i % 4];
    var col = kind.indexOf('red') === 0 ? RED : BLUE;
    el('circle', { cx: R * .28, cy: R * .32, r: R, fill: '#16341f', opacity: '.65' }, g); // hard print shadow
    var spin = el('g', {}, g);
    if (kind === 'eight') el('circle', { r: R, fill: INK }, spin);
    else if (kind.indexOf('Stripe') > 0) {
      var cp = el('clipPath', { id: 'c' + i }, svg.querySelector('defs')); el('circle', { r: R }, cp);
      el('circle', { r: R, fill: CREAM }, spin);
      el('rect', { x: -R, y: -R * .52, width: R * 2, height: R * 1.04, fill: col, 'clip-path': 'url(#c' + i + ')' }, spin);
    } else el('circle', { r: R, fill: col }, spin);
    el('circle', { r: R, fill: '#fff', filter: 'url(#speck)', opacity: '.35' }, spin);
    el('circle', { r: R * .48, fill: CREAM }, spin);
    var t = el('text', { 'text-anchor': 'middle', y: R * .2, 'font-family': "'DM Serif Display',Georgia,serif", 'font-size': R * (kind === 'eight' ? .62 : .66), fill: INK }, spin);
    t.textContent = kind === 'eight' ? '8' : letter;
    el('path', { d: 'M' + (-R * .55) + ' ' + (-R * .45) + ' Q' + (-R * .2) + ' ' + (-R * .85) + ' ' + (R * .25) + ' ' + (-R * .72), fill: 'none', stroke: '#fff', 'stroke-width': R * .12, 'stroke-linecap': 'round', opacity: '.55' }, spin);
    return { g: g, spin: spin, x: 0, y: 0, vx: 0, vy: 0, a: 0, eight: kind === 'eight' };
  }

  function propsLayer() {
    var g = el('g', {}), s = Math.min(W, H) / 900;
    var put = function (x, y, rot, html) { var p = el('g', { transform: 'translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')' }, g); p.innerHTML = html; };
    // matchbook
    put(W * .1, landscape ? H * .18 : H * .04, -12,
      '<rect x="6" y="8" width="150" height="190" fill="#16341f" opacity=".6"/><rect width="150" height="190" fill="' + CREAM + '"/><rect y="150" width="150" height="40" fill="' + INK + '"/>' +
      '<text x="75" y="70" text-anchor="middle" font-family="\'DM Serif Display\',Georgia,serif" font-size="54" fill="#2f7a4a">sg</text>' +
      '<text x="75" y="98" text-anchor="middle" font-family="Courier New,monospace" font-size="12" font-weight="700" fill="#2f7a4a">CARD TABLE &amp;</text>' +
      '<text x="75" y="114" text-anchor="middle" font-family="Courier New,monospace" font-size="12" font-weight="700" fill="#2f7a4a">POOL LOUNGE</text>' +
      '<text x="75" y="140" text-anchor="middle" font-family="Courier New,monospace" font-size="9" fill="#2f7a4a">OPEN LATE · NEW HAVEN</text>' +
      '<rect width="150" height="190" fill="#fff" filter="url(#speck)" opacity=".4"/>');
    // napkin note
    put(W * .78, H * .16, 7,
      '<rect x="8" y="10" width="220" height="200" fill="#16341f" opacity=".6"/><rect width="220" height="200" fill="' + CREAM + '"/>' +
      '<text x="110" y="78" text-anchor="middle" font-family="\'Nanum Pen Script\',cursive" font-size="30" fill="' + INK + '">the card table</text>' +
      '<text x="110" y="110" text-anchor="middle" font-family="\'Nanum Pen Script\',cursive" font-size="26" fill="' + INK + '">new haven, ct</text>' +
      '<text x="110" y="140" text-anchor="middle" font-family="\'Nanum Pen Script\',cursive" font-size="26" fill="' + INK + '">sofiagrimm.com</text>' +
      '<path d="M70 40 q20 -14 40 0 q20 -14 40 0 q-20 18 -40 10 q-20 8 -40 -10z" fill="' + RED + '" opacity=".85"/>' +
      '<rect width="220" height="200" fill="#fff" filter="url(#speck)" opacity=".4"/>');
    // dice
    var die = function (x, y, rot, pips) {
      var p = '<rect x="5" y="6" width="56" height="56" rx="8" fill="#16341f" opacity=".6"/><rect width="56" height="56" rx="8" fill="' + CREAM + '"/>';
      pips.forEach(function (q) { p += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="5.5" fill="' + INK + '"/>'; });
      put(x, y, rot, p + '<rect width="56" height="56" rx="8" fill="#fff" filter="url(#speck)" opacity=".35"/>');
    };
    die(W * .86, H * .48, 14, [[28, 28]]); die(W * .9, H * .4, -10, [[16, 14], [40, 14], [16, 28], [40, 28], [16, 42], [40, 42]]);
    // chalk and a coaster
    put(W * .08, H * .7, 18, '<rect x="5" y="6" width="54" height="54" fill="#16341f" opacity=".6"/><rect width="54" height="54" fill="' + BLUE + '"/><rect x="10" y="10" width="34" height="34" fill="#4c86b8"/><rect width="54" height="54" fill="#fff" filter="url(#speck)" opacity=".35"/>');
    put(W * .8, H * .82, 0, '<circle cx="8" cy="10" r="66" fill="#16341f" opacity=".6"/><circle r="66" fill="' + CREAM + '"/><text y="14" text-anchor="middle" font-family="\'DM Serif Display\',Georgia,serif" font-size="40" fill="' + RED + '">cards</text><circle r="66" fill="#fff" filter="url(#speck)" opacity=".35"/>');
    return g;
  }

  function build() {
    W = innerWidth; H = innerHeight; svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.innerHTML = '';
    landscape = W >= H; R = Math.min(W, H) * (landscape ? .032 : .045);
    defs(); props = propsLayer();
    // rack: four rows (1, 2, 3, 4) pointing at the 8 ball
    var apex = landscape ? { x: W * .56, y: H * .52 } : { x: W * .5, y: H * .44 };
    var ax = landscape ? { x: 1, y: 0 } : { x: 0, y: 1 }, px = landscape ? { x: 0, y: 1 } : { x: 1, y: 0 };
    var rows = [1, 2, 3, 4], pos = [], gap = R * 2.02;
    rows.forEach(function (n, r) { for (var k = 0; k < n; k++) { var off = (k - (n - 1) / 2) * gap; pos.push({ x: apex.x + ax.x * r * gap * .87 + px.x * off, y: apex.y + ax.y * r * gap * .87 + px.y * off }); } });
    // rack frame
    var c1 = { x: apex.x - ax.x * R * 1.6, y: apex.y - ax.y * R * 1.6 }, back = 3 * gap * .87 + R * 1.5, half = 1.5 * gap + R * 1.6;
    var c2 = { x: apex.x + ax.x * back + px.x * half, y: apex.y + ax.y * back + px.y * half }, c3 = { x: apex.x + ax.x * back - px.x * half, y: apex.y + ax.y * back - px.y * half };
    rack = el('g', {});
    var tri = 'M' + c1.x + ' ' + c1.y + ' L' + c2.x + ' ' + c2.y + ' L' + c3.x + ' ' + c3.y + 'Z';
    el('path', { d: tri, fill: 'none', stroke: '#16341f', 'stroke-width': R * .9, 'stroke-linejoin': 'round', opacity: '.6', transform: 'translate(' + R * .25 + ' ' + R * .3 + ')' }, rack);
    el('path', { d: tri, fill: 'none', stroke: INK, 'stroke-width': R * .75, 'stroke-linejoin': 'round' }, rack);
    el('path', { d: tri, fill: 'none', stroke: CREAM, 'stroke-width': R * .18, 'stroke-linejoin': 'round', opacity: '.75', 'stroke-dasharray': R * .9 + ' ' + R * .25 }, rack);
    balls = LETTERS.map(function (l, i) { var b = makeBall(i, l); b.x = pos[i].x; b.y = pos[i].y; return b; });
    var eight = makeBall(-1); eight.x = apex.x - ax.x * (landscape ? W * .26 : H * .22); eight.y = apex.y - ax.y * (landscape ? W * .26 : H * .22); balls.push(eight);
    dir = { x: ax.x, y: ax.y };
    // cue stick, pointing at the 8 ball
    cue = el('g', {});
    var L = Math.max(W, H) * .7;
    el('rect', { x: -L, y: -R * .32 + R * .3, width: L, height: R * .64, fill: '#16341f', opacity: '.6', transform: 'translate(' + R * .2 + ' 0)' }, cue);
    el('rect', { x: -L, y: -R * .26, width: L, height: R * .52, rx: R * .26, fill: '#c99b5e' }, cue);
    el('rect', { x: -L, y: -R * .34, width: L * .35, height: R * .68, rx: R * .34, fill: '#7a4a2a' }, cue);
    el('rect', { x: -R * .9, y: -R * .26, width: R * .9, height: R * .52, fill: CREAM }, cue);
    el('rect', { x: -R * .25, y: -R * .26, width: R * .25, height: R * .52, rx: R * .1, fill: BLUE }, cue);
    el('rect', { x: -L, y: -R * .26, width: L, height: R * .52, fill: '#fff', filter: 'url(#speck)', opacity: '.3' }, cue);
    var p = landscape ? { left: eight.x - W * .2, top: eight.y + R * 2.2 } : { left: W * .1, top: H * .7 };
    prompt.style.left = p.left + 'px'; prompt.style.top = p.top + 'px';
    draw();
  }

  function draw() {
    balls.forEach(function (b) { b.g.setAttribute('transform', 'translate(' + b.x + ' ' + b.y + ')'); b.spin.setAttribute('transform', 'rotate(' + b.a + ')'); });
    var e = balls[balls.length - 1], back = R + 6 + pull;
    tip = { x: e.x - dir.x * back, y: e.y - dir.y * back };
    var ang = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
    if (cue) cue.setAttribute('transform', 'translate(' + tip.x + ' ' + tip.y + ') rotate(' + ang + ')');
  }

  // aiming: drag anywhere to pull the cue straight back; let go to shoot
  var dragFrom = null, maxPull;
  pool.addEventListener('pointerdown', function (e) {
    if (state !== 'aim' || e.target.classList.contains('skip')) return;
    dragFrom = { x: e.clientX, y: e.clientY }; maxPull = Math.min(W, H) * .2; pool.classList.add('aiming'); pool.setPointerCapture(e.pointerId);
  });
  pool.addEventListener('pointermove', function (e) {
    if (!dragFrom) return;
    var dx = e.clientX - dragFrom.x, dy = e.clientY - dragFrom.y;
    pull = Math.max(0, Math.min(maxPull, -(dx * dir.x + dy * dir.y) + Math.hypot(dx, dy) * .35)); draw();
  });
  pool.addEventListener('pointerup', function () {
    if (!dragFrom) return; dragFrom = null; pool.classList.remove('aiming');
    shoot(Math.max(.45, pull / maxPull));
  });
  pool.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && state === 'aim') { e.preventDefault(); shoot(.8); } });
  pool.tabIndex = 0;

  function shoot(power) {
    if (state !== 'aim') return; state = 'strike'; prompt.style.opacity = 0;
    var from = pull, t0 = performance.now();
    (function thrust(now) {
      var k = Math.min(1, (now - t0) / 110); pull = from * (1 - k) - R * .2 * k; draw();
      if (k < 1) return requestAnimationFrame(thrust);
      var e = balls[balls.length - 1], sp = Math.min(W, H) * .045 * (.55 + power);
      e.vx = dir.x * sp; e.vy = dir.y * sp; state = 'roll';
      rack.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, delay: 220, fill: 'forwards' });
      cue.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 150, fill: 'forwards' });
      run();
    })(t0);
  }

  // simple billiards: equal masses, elastic hits, cushion bounces, a little felt friction
  var revealR = 0, revealing = false, rollStart = 0;
  function run() {
    rollStart = performance.now();
    var e = balls[balls.length - 1], m = Math.min(W, H) * .03;
    (function step(now) {
      for (var sub = 0; sub < 4; sub++) {
        balls.forEach(function (b) {
          b.x += b.vx / 4; b.y += b.vy / 4; b.vx *= .9968; b.vy *= .9968; b.a += Math.hypot(b.vx, b.vy) / 4 / R * 57.3 * (b.vx >= 0 ? 1 : -1);
          if (b.x < m + R) { b.x = m + R; b.vx = Math.abs(b.vx) * .8; } if (b.x > W - m - R) { b.x = W - m - R; b.vx = -Math.abs(b.vx) * .8; }
          if (b.y < m + R) { b.y = m + R; b.vy = Math.abs(b.vy) * .8; } if (b.y > H - m - R) { b.y = H - m - R; b.vy = -Math.abs(b.vy) * .8; }
        });
        for (var i = 0; i < balls.length; i++) for (var j = i + 1; j < balls.length; j++) {
          var A = balls[i], B = balls[j], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
          if (d > 0 && d < 2 * R) {
            var nx = dx / d, ny = dy / d, over = (2 * R - d) / 2;
            A.x -= nx * over; A.y -= ny * over; B.x += nx * over; B.y += ny * over;
            var rel = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny;
            if (rel > 0) { A.vx -= rel * nx * .96; A.vy -= rel * ny * .96; B.vx += rel * nx * .96; B.vy += rel * ny * .96; }
          }
        }
      }
      // after the break, keep the 8 ball rolling and open the felt around it
      var since = now - rollStart;
      if (since > 450 && !revealing) {
        revealing = true;
        var ang = Math.atan2(H * .5 - e.y, (W * .5) - e.x) + (Math.random() - .5);
        var sp = Math.min(W, H) * .02; e.vx = Math.cos(ang) * sp; e.vy = Math.sin(ang) * sp;
      }
      if (revealing) {
        revealR += Math.max(W, H) * .012 + revealR * .045;
        var mask = 'radial-gradient(circle ' + revealR + 'px at ' + e.x + 'px ' + e.y + 'px, transparent 98%, #000 100%)';
        pool.style.webkitMaskImage = mask; pool.style.maskImage = mask;
      }
      draw();
      if (revealR < Math.hypot(W, H) * 1.05) requestAnimationFrame(step); else done();
    })(performance.now());
  }

  function done() {
    sessionStorage.setItem('sg-pool-done', '1');
    document.documentElement.style.overflow = '';
    pool.remove(); st.remove();
  }
  pool.querySelector('.skip').addEventListener('click', function () {
    if (state === 'aim') { state = 'roll'; revealing = true; prompt.style.opacity = 0; balls[balls.length - 1].vx = 0; run(); }
  });

  build(); pool.focus();
  addEventListener('resize', function () { if (state === 'aim') build(); });
})();
