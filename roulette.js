// A roulette wheel tucked into the bottom-right corner of the card table. Click it to spin:
// the wheel turns one way, the ball the other, it clatters into a pocket, and wherever it
// lands decides which page of the site you go to next.
(function () {
  if (/[?&]arrange\b/.test(location.search)) return;
  var PAGES = [
    ['home', 'index.html'], ['about', 'about.html'], ['research', 'research.html'], ['the card catalog', 'lab/cards.html'],
    ['notes', 'lab/notes.html'], ['sofia is', 'lab/sofia-is.html'], ['the globe', 'lab/globe.html'], ['tilt', 'lab/lace.html'], ['a letter', 'contact.html']
  ];
  // European wheel order, starting at 0
  var ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var N = ORDER.length, STEP = 360 / N;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = `
  #roulette{position:fixed;right:clamp(-120px,-7vw,-60px);bottom:clamp(-120px,-7vw,-60px);width:clamp(220px,22vw,330px);aspect-ratio:1;z-index:40;cursor:pointer;border:0;padding:0;background:none;
    filter:drop-shadow(-14px -6px 30px rgba(0,0,0,.6));transition:transform .3s cubic-bezier(.2,.8,.2,1)}
  #roulette:hover,#roulette:focus-visible{transform:translate(-6px,-6px) scale(1.02);outline:none}
  #roulette svg{width:100%;height:100%;display:block;overflow:visible}
  #roulette .hint{position:absolute;left:4%;top:-6%;font:300 12px/1.4 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,236,214,.85);
    white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.7);transform:rotate(-8deg);pointer-events:none;transition:opacity .3s}
  #rouletteResult{position:fixed;right:clamp(16px,3vw,40px);bottom:clamp(170px,17vw,260px);z-index:41;background:#0f0f12;color:#f3eee4;border:1px solid #c9a45a;
    padding:12px 18px;font:300 13px/1.5 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;box-shadow:0 14px 30px rgba(0,0,0,.5);opacity:0;transform:translateY(10px);
    transition:opacity .3s,transform .3s;pointer-events:none}
  #rouletteResult.on{opacity:1;transform:none}
  #rouletteResult b{display:block;font:400 30px/1 'DM Serif Display',Georgia,serif;letter-spacing:.02em;text-transform:none;margin-bottom:4px}
  @media (max-width:760px){#roulette{width:220px;right:-80px;bottom:-80px}#rouletteResult{bottom:160px}}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var NS = 'http://www.w3.org/2000/svg';
  var btn = document.createElement('button'); btn.id = 'roulette'; btn.type = 'button';
  btn.setAttribute('aria-label', 'Spin the roulette wheel to go to a random page');
  var result = document.createElement('div'); result.id = 'rouletteResult'; result.setAttribute('role', 'status');

  // ── draw the wheel
  var C = 200, svgParts = [];
  var p = function (r, a) { a = (a - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  var wedge = function (r0, r1, a0, a1) { var A = p(r1, a0), B = p(r1, a1), Cc = p(r0, a1), D = p(r0, a0);
    return 'M' + A + ' A' + r1 + ' ' + r1 + ' 0 0 1 ' + B + ' L' + Cc + ' A' + r0 + ' ' + r0 + ' 0 0 0 ' + D + 'Z'; };
  var pockets = '', numbers = '', frets = '';
  ORDER.forEach(function (n, i) {
    var a0 = i * STEP - STEP / 2, a1 = a0 + STEP, col = n === 0 ? '#1f7a4f' : ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].indexOf(n) >= 0 ? '#b3242b' : '#141416');
    numbers += '<path d="' + wedge(150, 178, a0, a1) + '" fill="' + col + '"/>';
    pockets += '<path d="' + wedge(112, 150, a0, a1) + '" fill="' + col + '" opacity=".9"/>';
    var t = p(164, i * STEP);
    numbers += '<text x="' + t[0] + '" y="' + t[1] + '" fill="#f3eee4" font-family="Inter,Helvetica Neue,Arial,sans-serif" font-weight="600" font-size="11" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + (i * STEP) + ' ' + t[0] + ' ' + t[1] + ')">' + n + '</text>';
    var f0 = p(112, a0), f1 = p(178, a0); frets += '<path d="M' + f0 + ' L' + f1 + '" stroke="#d9c9a0" stroke-width="1.2" opacity=".8"/>';
  });
  var turret = '';
  for (var k = 0; k < 4; k++) { var a = k * 90, e = p(78, a), e2 = p(64, a + 45); turret += '<path d="M' + C + ' ' + C + ' L' + e + '" stroke="url(#rlChrome)" stroke-width="7" stroke-linecap="round"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="7" fill="url(#rlChrome)"/>'; }
  btn.innerHTML = '<span class="hint">spin me</span><svg viewBox="0 0 400 400" aria-hidden="true"><defs>' +
    '<radialGradient id="rlWood" cx="45%" cy="40%" r="60%"><stop offset=".7" stop-color="#6b2a18"/><stop offset=".86" stop-color="#4a1a0e"/><stop offset="1" stop-color="#2a0e07"/></radialGradient>' +
    '<radialGradient id="rlBowl" cx="50%" cy="50%" r="50%"><stop offset=".5" stop-color="#3a1810"/><stop offset="1" stop-color="#1a0a06"/></radialGradient>' +
    '<radialGradient id="rlCone" cx="42%" cy="38%" r="60%"><stop offset="0" stop-color="#8a4126"/><stop offset=".7" stop-color="#5a2414"/><stop offset="1" stop-color="#2e110a"/></radialGradient>' +
    '<linearGradient id="rlChrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".4" stop-color="#9aa0a8"/><stop offset=".6" stop-color="#e6e8ec"/><stop offset="1" stop-color="#6f747c"/></linearGradient>' +
    '<radialGradient id="rlBall" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#e8e6e0"/><stop offset="1" stop-color="#a9a59c"/></radialGradient>' +
    '<radialGradient id="rlSheen" cx="35%" cy="25%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="200" cy="200" r="198" fill="url(#rlWood)"/><circle cx="200" cy="200" r="186" fill="url(#rlBowl)"/>' +
    '<circle cx="200" cy="200" r="186" fill="none" stroke="#c9a45a" stroke-width="2" opacity=".6"/>' +
    '<g id="rlWheel">' + numbers + pockets + frets +
    '<circle cx="200" cy="200" r="178" fill="none" stroke="url(#rlChrome)" stroke-width="2.5"/><circle cx="200" cy="200" r="150" fill="none" stroke="#d9c9a0" stroke-width="1.4"/>' +
    '<circle cx="200" cy="200" r="112" fill="url(#rlCone)"/><circle cx="200" cy="200" r="112" fill="none" stroke="#d9c9a0" stroke-width="1.5"/>' +
    [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { var q0 = p(30, i * 45), q1 = p(108, i * 45); return '<path d="M' + q0 + ' L' + q1 + '" stroke="#3a160c" stroke-width="2" opacity=".6"/>'; }).join('') +
    turret + '<circle cx="200" cy="200" r="24" fill="url(#rlChrome)"/><circle cx="200" cy="200" r="10" fill="#d8dbe0"/></g>' +
    '<circle id="rlBallEl" cx="200" cy="18" r="7" fill="url(#rlBall)"/>' +
    '<circle cx="200" cy="200" r="198" fill="url(#rlSheen)"/></svg>';
  document.body.appendChild(btn); document.body.appendChild(result);
  var wheel = btn.querySelector('#rlWheel'), ball = btn.querySelector('#rlBallEl'), hint = btn.querySelector('.hint');

  // ── sound
  var ac = null;
  function ctx() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; }
  function tick(vol, f) { var c = ac; if (!c) return; var t = c.currentTime, n = Math.ceil(c.sampleRate * .02), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * .003));
    var s = c.createBufferSource(); s.buffer = b; var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f || 3800; bp.Q.value = 2; var g = c.createGain(); g.gain.value = vol;
    s.connect(bp).connect(g).connect(c.destination); s.start(t); }
  function whirr(on) { var c = ac; if (!c) return null; var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; var s = c.createBufferSource(); s.buffer = b; s.loop = true; var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .7;
    var g = c.createGain(); g.gain.value = .05; s.connect(f).connect(g).connect(c.destination); s.start(); return { s: s, g: g }; }

  var spinning = false, wAng = 0;
  function spin() {
    if (spinning) return; spinning = true; ctx(); hint.style.opacity = 0; result.classList.remove('on');
    var pick = Math.floor(Math.random() * N), number = ORDER[pick];
    var page = PAGES[number % PAGES.length];
    var dur = still ? 600 : 5200, t0 = performance.now(), w0 = wAng, wTurn = 360 * 3 + Math.random() * 360;
    // the ball ends sitting in its pocket, wherever the wheel has stopped
    // stop the wheel so the winning pocket sits up-left, the part of the wheel you can see
    var want = -48, cur = ((w0 + wTurn + pick * STEP) % 360 + 360) % 360; wTurn += ((want - cur) % 360 + 360) % 360;
    var wEnd = w0 + wTurn, bEndWorld = wEnd + pick * STEP, b0 = -90 + 0, bTurn = -(360 * 6) - (((b0 - bEndWorld) % 360) + 360) % 360;
    var bStart = bEndWorld - bTurn, lastPocket = null, noise = whirr();
    (function frame(now) {
      var k = Math.min(1, (now - t0) / dur), ew = 1 - Math.pow(1 - k, 3), eb = 1 - Math.pow(1 - k, 2.4);
      wAng = w0 + wTurn * ew; var bWorld = bStart + bTurn * eb;
      // the ball rides the outer track, then drops in and rattles over the frets
      var drop = Math.max(0, (k - .62) / .38), r = 182 - drop * 51 + Math.sin(drop * Math.PI * 7) * (1 - drop) * 10 * (drop > 0 ? 1 : 0);
      wheel.setAttribute('transform', 'rotate(' + wAng + ' 200 200)');
      var bp = p(r, bWorld - 0); ball.setAttribute('cx', bp[0]); ball.setAttribute('cy', bp[1]);
      var rel = Math.floor((((bWorld - wAng) % 360) + 360) % 360 / STEP);
      if (drop > 0 && rel !== lastPocket) { lastPocket = rel; tick(.25 * (1 - drop * .6), 3000 + Math.random() * 1500); }
      if (noise) noise.g.gain.value = .05 * (1 - k);
      if (k < 1) return requestAnimationFrame(frame);
      if (noise) { try { noise.s.stop(); } catch (e) {} }
      tick(.4, 1800);
      result.innerHTML = '<b>' + number + '</b>' + (number === 0 ? 'green' : '') + ' off to ' + page[0];
      result.classList.add('on');
      setTimeout(function () {
        document.body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
        setTimeout(function () { location.href = page[1]; }, 330);
      }, still ? 600 : 1500);
    })(t0);
  }
  btn.addEventListener('click', spin);
})();
