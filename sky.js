// Painted night sky: deep blue gradient, soft clouds, colored twinkling stars, grass on the horizon.
// Drop <script src="sky.js" defer></script> into any page. Content should sit at z-index 10 or above.
(function () {
  var css = `
    html{background:#0b1633}
    body{background:transparent !important}
    .sky-gradient{position:fixed;inset:0;z-index:0;pointer-events:none;
      background:
        radial-gradient(ellipse 70% 45% at 65% 38%, rgba(120,150,230,.16) 0%, transparent 70%),
        radial-gradient(ellipse 60% 40% at 20% 70%, rgba(60,140,170,.14) 0%, transparent 70%),
        linear-gradient(180deg,#0a1530 0%,#10224a 30%,#163566 58%,#1b4a6e 82%,#205468 100%)}
    #skyStars{position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
    .sky-clouds{position:fixed;inset:0;z-index:2;pointer-events:none;width:100%;height:100%}
    .sky-grass{position:fixed;left:0;right:0;bottom:0;height:clamp(70px,11vh,120px);z-index:3;pointer-events:none;width:100%}
    .nebula{display:none}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var g = document.createElement('div'); g.className = 'sky-gradient';
  var c = document.createElement('canvas'); c.id = 'skyStars';
  var clouds = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  clouds.setAttribute('class', 'sky-clouds'); clouds.setAttribute('viewBox', '0 0 1440 900');
  clouds.setAttribute('preserveAspectRatio', 'xMidYMid slice'); clouds.setAttribute('aria-hidden', 'true');
  clouds.innerHTML = `
    <defs>
      <filter id="cloudSoft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
      <linearGradient id="cloudFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9fb4ec" stop-opacity=".55"/><stop offset="1" stop-color="#4e68b8" stop-opacity=".35"/>
      </linearGradient>
    </defs>
    <g filter="url(#cloudSoft)" fill="url(#cloudFill)">
      <g transform="translate(-40 600)">
        <ellipse cx="160" cy="40" rx="150" ry="34"/><ellipse cx="250" cy="10" rx="80" ry="44"/><ellipse cx="330" cy="30" rx="90" ry="32"/><ellipse cx="420" cy="48" rx="120" ry="22"/>
      </g>
      <g transform="translate(1000 230)">
        <ellipse cx="120" cy="40" rx="130" ry="26"/><ellipse cx="210" cy="14" rx="70" ry="36"/><ellipse cx="290" cy="32" rx="110" ry="24"/>
      </g>
      <g transform="translate(900 700)" opacity=".8">
        <ellipse cx="80" cy="30" rx="80" ry="20"/><ellipse cx="140" cy="12" rx="46" ry="26"/><ellipse cx="200" cy="28" rx="70" ry="18"/>
      </g>
    </g>`;
  var grass = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  grass.setAttribute('class', 'sky-grass'); grass.setAttribute('viewBox', '0 0 1440 120');
  grass.setAttribute('preserveAspectRatio', 'none'); grass.setAttribute('aria-hidden', 'true');
  function tufts(base, amp, step, seed) {
    var d = 'M0 120 L0 ' + base, x = 0, s = seed;
    function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    while (x < 1440) {
      var w = step * (0.6 + r()), h = amp * (0.4 + r());
      d += ' Q' + (x + w * 0.3).toFixed(0) + ' ' + (base - h).toFixed(0) + ' ' + (x + w * 0.5).toFixed(0) + ' ' + (base - h * 0.9).toFixed(0);
      d += ' Q' + (x + w * 0.7).toFixed(0) + ' ' + (base - h * 0.3).toFixed(0) + ' ' + (x + w).toFixed(0) + ' ' + (base + r() * 4).toFixed(0);
      x += w;
    }
    return d + ' L1440 120 Z';
  }
  grass.innerHTML =
    '<path d="' + tufts(52, 34, 46, 7) + '" fill="#145040"/>' +
    '<path d="' + tufts(72, 28, 30, 21) + '" fill="#0f3f33"/>' +
    '<path d="' + tufts(94, 20, 22, 42) + '" fill="#0b2f27"/>';

  var first = document.body.firstChild;
  [g, c, clouds, grass].forEach(function (el) { document.body.insertBefore(el, first); });

  // ── The real sky over New Haven, looking north, running ~240x faster than real time.
  //    Stars are placed from their actual right ascension / declination, so the
  //    constellations wheel around Polaris the way they really do overnight.
  var ctx = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LAT = 41.31 * Math.PI / 180, LON = -72.93, SPEED = still ? 1 : 240;
  var t0 = Date.now(), p0 = performance.now();
  function H(h, m, s) { return (h + m / 60 + (s || 0) / 3600) * 15; }          // RA in degrees
  function D(d, m) { return d + (d < 0 ? -1 : 1) * (m || 0) / 60; }            // Dec in degrees
  // [name, RA°, Dec°, magnitude]
  var C = [
    { name: 'Big Dipper', stars: [['Dubhe', H(11,3,44), D(61,45), 1.8], ['Merak', H(11,1,50), D(56,23), 2.4], ['Phecda', H(11,53,50), D(53,41), 2.4], ['Megrez', H(12,15,25), D(57,1), 3.3], ['Alioth', H(12,54,2), D(55,57), 1.8], ['Mizar', H(13,23,56), D(54,55), 2.2], ['Alkaid', H(13,47,32), D(49,18), 1.9]],
      lines: [[6,5],[5,4],[4,3],[3,0],[0,1],[1,2],[2,3]] },
    { name: 'Little Dipper', stars: [['Polaris', H(2,31,49), D(89,16), 2.0], ['Yildun', H(17,32,13), D(86,35), 4.4], ['ε UMi', H(16,45,58), D(82,2), 4.2], ['ζ UMi', H(15,44,4), D(77,48), 4.3], ['Kochab', H(14,50,42), D(74,9), 2.1], ['Pherkad', H(15,20,44), D(71,50), 3.0], ['η UMi', H(16,17,30), D(75,45), 4.9]],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]] },
    { name: 'Cassiopeia', stars: [['Caph', H(0,9,11), D(59,9), 2.3], ['Schedar', H(0,40,30), D(56,32), 2.2], ['Navi', H(0,56,42), D(60,43), 2.4], ['Ruchbah', H(1,25,49), D(60,14), 2.7], ['Segin', H(1,54,24), D(63,40), 3.4]],
      lines: [[0,1],[1,2],[2,3],[3,4]] },
    { name: 'Cepheus', stars: [['Alderamin', H(21,18,35), D(62,35), 2.5], ['Alfirk', H(21,28,39), D(70,33), 3.2], ['Errai', H(23,39,21), D(77,38), 3.2], ['ι Cep', H(22,49,41), D(66,12), 3.5], ['ζ Cep', H(22,10,51), D(58,12), 3.4]],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,0],[1,3]] },
    { name: 'Cygnus', stars: [['Deneb', H(20,41,26), D(45,17), 1.3], ['Sadr', H(20,22,14), D(40,15), 2.2], ['Albireo', H(19,30,43), D(27,58), 3.1], ['δ Cyg', H(19,44,58), D(45,8), 2.9], ['Gienah', H(20,46,13), D(33,58), 2.5]],
      lines: [[0,1],[1,2],[3,1],[1,4]] },
    { name: 'Lyra', stars: [['Vega', H(18,36,56), D(38,47), 0.0], ['ζ Lyr', H(18,44,46), D(37,36), 4.3], ['δ Lyr', H(18,54,30), D(36,54), 4.3], ['Sulafat', H(18,58,57), D(32,41), 3.3], ['Sheliak', H(18,50,5), D(33,22), 3.5]],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,1]] },
    { name: 'Draco', stars: [['Rastaban', H(17,30,26), D(52,18), 2.8], ['Eltanin', H(17,56,36), D(51,29), 2.2], ['Grumium', H(17,53,31), D(56,52), 3.8], ['ν Dra', H(17,32,16), D(55,11), 4.9], ['Altais', H(19,12,33), D(67,40), 3.1], ['χ Dra', H(18,21,3), D(72,44), 3.6], ['ζ Dra', H(17,8,47), D(65,43), 3.2], ['η Dra', H(16,23,59), D(61,31), 2.7], ['Edasich', H(15,24,56), D(58,58), 3.3], ['Thuban', H(14,4,23), D(64,22), 3.7]],
      lines: [[0,1],[1,2],[2,3],[3,0],[2,4],[4,5],[5,6],[6,7],[7,8],[8,9]] },
    { name: 'Perseus', stars: [['Mirfak', H(3,24,19), D(49,51), 1.8], ['Algol', H(3,8,10), D(40,57), 2.1], ['δ Per', H(3,42,55), D(47,47), 3.0], ['γ Per', H(3,4,48), D(53,30), 2.9], ['ε Per', H(3,57,51), D(40,0), 2.9], ['ζ Per', H(3,54,8), D(31,53), 2.8]],
      lines: [[3,0],[0,2],[2,4],[4,5],[0,1]] },
    { name: 'Auriga', stars: [['Capella', H(5,16,41), D(45,59), 0.1], ['Menkalinan', H(5,59,32), D(44,57), 1.9], ['θ Aur', H(5,59,43), D(37,13), 2.6], ['Elnath', H(5,26,18), D(28,36), 1.7], ['ι Aur', H(4,57,0), D(33,10), 2.7]],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,0]] }
  ];
  // the Pleiades as a little cluster
  var pleiades = [[3,47,24,24.1],[3,45,49,24.4],[3,44,52,24.1],[3,49,9,24.05],[3,46,20,23.9],[3,45,12,24.5],[3,49,11,24.13]].map(function (p) { return [H(p[0], p[1], p[2]), p[3], 4.2]; });
  // faint background stars scattered over the whole sky, so they turn with it
  var field = [], colors = ['#ffffff', '#ffffff', '#ffffff', '#e8f1ff', '#ffd6e6', '#ffe9a8', '#c9e6ff', '#f6c3d9'];
  for (var i = 0; i < 1100; i++) { var dec = Math.asin(Math.random() * 1.6 - 0.6) * 180 / Math.PI;
    field.push({ ra: Math.random() * 360, dec: dec, m: 3.8 + Math.random() * 2.4, c: colors[(Math.random() * colors.length) | 0], p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.2 }); }
  C.forEach(function (k) { k.stars.forEach(function (s) { s.p = Math.random() * 6.28; s.s = 0.6 + Math.random(); }); });

  function lst(ms) { var jd = ms / 86400000 + 2440587.5, d = jd - 2451545.0; var g = (280.46061837 + 360.98564736629 * d) % 360; return (g + LON + 360) % 360; }
  var W, Hh, horizon;
  function size() { W = innerWidth; Hh = innerHeight; c.width = W * dpr; c.height = Hh * dpr; horizon = Hh * 0.9; }
  // alt/az for a star, then a simple fisheye-ish map: azimuth across the width (north in the middle), altitude up the screen
  function project(ra, dec, L) {
    var h = (L - ra) * Math.PI / 180, d = dec * Math.PI / 180;
    var sinAlt = Math.sin(LAT) * Math.sin(d) + Math.cos(LAT) * Math.cos(d) * Math.cos(h);
    var alt = Math.asin(sinAlt);
    var az = Math.atan2(-Math.sin(h) * Math.cos(d), Math.cos(LAT) * Math.sin(d) - Math.sin(LAT) * Math.cos(d) * Math.cos(h)) * 180 / Math.PI;
    if (alt < -0.02) return null;
    var span = W > 760 ? 120 : 75;
    return { x: W / 2 + az / span * (W / 2), y: horizon - (alt * 180 / Math.PI) / 90 * horizon * 1.08, alt: alt };
  }
  function twinkle(now, s) { return still ? 0.9 : 0.55 + 0.45 * Math.abs(Math.sin(now * 0.0012 * s.s + s.p)); }
  function dot(x, y, r, col, a, glow) {
    if (glow) { var g = ctx.createRadialGradient(x, y, 0, x, y, r * 5); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = a * 0.4; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, 6.28); ctx.fill(); }
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
  }
  function draw(now) {
    var L = lst(t0 + (now - p0) * SPEED);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh);
    for (var i = 0; i < field.length; i++) { var f = field[i], p = project(f.ra, f.dec, L); if (!p || p.x < -10 || p.x > W + 10) continue;
      dot(p.x, p.y, Math.max(0.45, (6.4 - f.m) * 0.38), f.c, twinkle(now, f) * 0.85, false); }
    pleiades.forEach(function (s, i) { var p = project(s[0], s[1], L); if (p) dot(p.x, p.y, 0.9, '#dfe9ff', 0.6 + 0.4 * Math.abs(Math.sin(now * 0.002 + i)), false); });
    ctx.font = '11px "Courier Prime", Courier, monospace';
    C.forEach(function (k) {
      var pts = k.stars.map(function (s) { return project(s[1], s[2], L); });
      ctx.globalAlpha = 0.28; ctx.strokeStyle = '#cfe0ff'; ctx.lineWidth = 1;
      k.lines.forEach(function (l) { var a = pts[l[0]], b = pts[l[1]]; if (!a || !b || Math.abs(a.x - b.x) > W / 2) return; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      var sx = 0, sy = 0, n = 0;
      k.stars.forEach(function (s, i) { var p = pts[i]; if (!p) return; sx += p.x; sy += p.y; n++;
        var r = Math.max(1, (4.6 - s[3]) * 0.75); dot(p.x, p.y, r, s[3] < 1 ? '#fff6e0' : '#ffffff', twinkle(now, s), s[3] < 2.6); });
      if (n >= 3) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#cfe0ff'; ctx.fillText(k.name.toLowerCase(), sx / n + 10, sy / n - 12); }
    });
    ctx.globalAlpha = 1;
    if (!still) requestAnimationFrame(draw); else setTimeout(function () { draw(performance.now()); }, 60000);
  }
  size(); draw(performance.now());
  addEventListener('resize', function () { size(); if (still) draw(performance.now()); });
})();
