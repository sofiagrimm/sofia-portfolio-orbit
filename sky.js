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

  var ctx = c.getContext('2d'), stars = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
  var colors = ['#ffffff', '#ffffff', '#ffffff', '#e8f1ff', '#ffd6e6', '#ffe9a8', '#c9e6ff', '#f6c3d9'];
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function build() {
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    var n = Math.round(innerWidth * innerHeight / 3800); stars = [];
    for (var i = 0; i < n; i++) {
      // a little cluster up and to the right, like a smudge of the milky way
      var clustered = Math.random() < 0.18;
      var x = clustered ? innerWidth * (0.55 + Math.random() * 0.25) : Math.random() * innerWidth;
      var y = clustered ? innerHeight * (0.12 + Math.random() * 0.3) : Math.random() * innerHeight * 0.9;
      var big = Math.random() < 0.08;
      stars.push({ x: x, y: y, r: big ? 1.5 + Math.random() * 1.2 : 0.5 + Math.random() * 0.9,
        c: colors[(Math.random() * colors.length) | 0], p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.2, glow: big });
    }
  }
  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], a = still ? 0.85 : 0.55 + 0.45 * Math.abs(Math.sin(t * 0.001 * s.s + s.p));
      if (s.glow) {
        var gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        gr.addColorStop(0, s.c); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = a * 0.35; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 5, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = a; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!still) requestAnimationFrame(draw);
  }
  build(); draw(0);
  addEventListener('resize', function () { build(); if (still) draw(0); });
})();
