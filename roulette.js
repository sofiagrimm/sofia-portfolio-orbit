// A roulette wheel tucked into the bottom-right corner of the card table. Click it to spin:
// the wheel turns one way, the ball the other, it clatters into a pocket, and wherever it
// lands decides which page of the site you go to next.
(function () {
  if (/[?&]arrange\b/.test(location.search)) return;
  var ROOT = (document.currentScript && document.currentScript.src || location.href).replace(/[^/]*$/, '');
  var ALL = [
    ['home', 'index.html'], ['about', 'about.html'], ['research', 'research.html'], ['the card table', 'projects.html'], ['languages', 'lab/skills.html'], ['wonderland', 'lab/wonderland.html'], ['the card catalog', 'lab/cards.html'],
    ['notes', 'lab/notes.html'], ['sofia is', 'lab/sofia-is.html'], ['arts', 'lab/arts.html'], ['the globe', 'lab/globe.html'], ['tilt', 'lab/lace.html'], ['a letter', 'contact.html']
  ];
  var here = location.pathname.replace(/\/$/, '/index.html');
  var PAGES = ALL.filter(function (p) { return !here.endsWith('/' + p[1]); }).map(function (p) { return [p[0], ROOT + p[1]]; });
  // European wheel order, starting at 0
  var ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var N = ORDER.length, STEP = 360 / N;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = `
  #roulette{position:fixed;right:clamp(-120px,-7vw,-60px);bottom:clamp(-120px,-7vw,-60px);width:clamp(220px,22vw,330px);aspect-ratio:1;z-index:40;cursor:pointer;border:0;padding:0;background:none;
    filter:drop-shadow(-14px -6px 30px rgba(0,0,0,.6));will-change:transform;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
  #roulette{transform:none !important}
  #roulette:hover,#roulette:focus-visible{outline:none;filter:drop-shadow(-14px -6px 30px rgba(0,0,0,.6)) drop-shadow(0 0 16px rgba(255,214,140,.45))}
  #roulette svg{width:100%;height:100%;display:block;overflow:visible;transform:perspective(900px) rotateX(28deg) rotateZ(-8deg);transform-origin:50% 60%}
  #roulette .hint{position:absolute;left:4%;top:-6%;font:300 12px/1.4 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,236,214,.85);
    white-space:nowrap;text-shadow:none;background:rgba(24,12,10,.6);padding:4px 10px;border-radius:999px;transform:rotate(-8deg);pointer-events:none;transition:opacity .3s}
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

  // ── draw the wheel: ivory rim, a red and dark-walnut number ring in big white serif numerals,
  //    gold frets over warm wooden pockets, a polished brass cone and a gold turret with four arms
  var C = 200;
  var p = function (r, a) { a = (a - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  var wedge = function (r0, r1, a0, a1) { var A = p(r1, a0), B = p(r1, a1), Cc = p(r0, a1), D = p(r0, a0);
    return 'M' + A + ' A' + r1 + ' ' + r1 + ' 0 0 1 ' + B + ' L' + Cc + ' A' + r0 + ' ' + r0 + ' 0 0 0 ' + D + 'Z'; };
  var REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var ring = '', pockets = '', frets = '';
  ORDER.forEach(function (n, i) {
    var a0 = i * STEP - STEP / 2, a1 = a0 + STEP, col = n === 0 ? 'url(#rlGreen)' : (REDS.indexOf(n) >= 0 ? 'url(#rlRed)' : 'url(#rlDark)');
    ring += '<path d="' + wedge(146, 184, a0, a1) + '" fill="' + col + '"/>';
    var t = p(165, i * STEP);
    ring += '<text x="' + t[0] + '" y="' + t[1] + '" fill="#fbf6ea" font-family="\'DM Serif Display\',\'Bodoni 72\',Didot,Georgia,serif" font-size="' + (n > 9 ? 17 : 19) + '" text-anchor="middle" dominant-baseline="central" transform="rotate(' + (i * STEP) + ' ' + t[0] + ' ' + t[1] + ')">' + n + '</text>';
    ring += '<path d="M' + p(146, a0) + ' L' + p(184, a0) + '" stroke="#e6c98a" stroke-width="1" opacity=".55"/>';
    pockets += '<path d="' + wedge(112, 146, a0, a1) + '" fill="' + (i % 2 ? 'url(#rlPocketA)' : 'url(#rlPocketB)') + '"/>';
    frets += '<path d="M' + p(110, a0) + ' L' + p(146, a0) + '" stroke="url(#rlGold)" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M' + p(110, a0) + ' L' + p(146, a0) + '" stroke="#fff3c8" stroke-width=".8" opacity=".7"/>';
  });
  // the turret: four gold arms with knob ends around a stacked hub
  var arms = '';
  [45, 135, 225, 315].forEach(function (a, k) {
    var e = p(82, a);
    arms += '<path d="M' + C + ' ' + C + ' L' + e + '" stroke="#7a5418" stroke-width="10" stroke-linecap="round" opacity=".45" transform="translate(3 4)"/>' +
      '<path d="M' + C + ' ' + C + ' L' + e + '" stroke="url(#rlGoldArm)" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="9" fill="url(#rlKnob)"/><circle cx="' + (e[0] - 2.5) + '" cy="' + (e[1] - 3) + '" r="2.6" fill="#fffbe8" opacity=".9"/>';
  });
  btn.innerHTML = '<span class="hint">spin me</span><svg viewBox="0 0 400 400" aria-hidden="true"><defs>' +
    '<radialGradient id="rlRim" cx="40%" cy="35%" r="70%"><stop offset=".8" stop-color="#f6efdf"/><stop offset=".93" stop-color="#e2d5b8"/><stop offset="1" stop-color="#b9a988"/></radialGradient>' +
    '<linearGradient id="rlRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d0473f"/><stop offset="1" stop-color="#93231f"/></linearGradient>' +
    '<linearGradient id="rlDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3428"/><stop offset="1" stop-color="#2c1711"/></linearGradient>' +
    '<linearGradient id="rlGreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fc25a"/><stop offset="1" stop-color="#4f8a2e"/></linearGradient>' +
    '<linearGradient id="rlPocketA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c79a58"/><stop offset="1" stop-color="#7a5528"/></linearGradient>' +
    '<linearGradient id="rlPocketB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b5874a"/><stop offset="1" stop-color="#6a4a22"/></linearGradient>' +
    '<linearGradient id="rlGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e2a0"/><stop offset=".5" stop-color="#c9973e"/><stop offset="1" stop-color="#f2d58a"/></linearGradient>' +
    '<linearGradient id="rlGoldArm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2c2"/><stop offset=".35" stop-color="#e5b955"/><stop offset=".7" stop-color="#a87a26"/><stop offset="1" stop-color="#f0d07c"/></linearGradient>' +
    '<radialGradient id="rlKnob" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff6d2"/><stop offset=".45" stop-color="#e2b350"/><stop offset="1" stop-color="#8a6018"/></radialGradient>' +
    '<radialGradient id="rlCone" cx="42%" cy="36%" r="68%"><stop offset="0" stop-color="#fff8dc"/><stop offset=".35" stop-color="#f3dfa6"/><stop offset=".75" stop-color="#d4ab5c"/><stop offset="1" stop-color="#9c742e"/></radialGradient>' +
    '<radialGradient id="rlHub" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff6d2"/><stop offset=".4" stop-color="#e8bd5c"/><stop offset=".8" stop-color="#a7781f"/><stop offset="1" stop-color="#6e4c12"/></radialGradient>' +
    '<radialGradient id="rlBall" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".65" stop-color="#efebe2"/><stop offset="1" stop-color="#b8b2a6"/></radialGradient>' +
    '<radialGradient id="rlSheen" cx="35%" cy="25%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="200" cy="200" r="199" fill="url(#rlRim)"/><circle cx="200" cy="200" r="187" fill="none" stroke="#c9a45a" stroke-width="2.5"/>' +
    '<g id="rlWheel">' + ring + '<circle cx="200" cy="200" r="184" fill="none" stroke="#e6c98a" stroke-width="2"/>' +
    '<circle cx="200" cy="200" r="146" fill="#5a3a1c"/>' + pockets + frets +
    '<circle cx="200" cy="200" r="146" fill="none" stroke="url(#rlGold)" stroke-width="3"/>' +
    '<circle cx="200" cy="200" r="111" fill="url(#rlCone)"/><circle cx="200" cy="200" r="111" fill="none" stroke="#8a6424" stroke-width="2.5"/>' +
    '<ellipse cx="176" cy="172" rx="58" ry="40" fill="#fff" opacity=".22" transform="rotate(-30 176 172)"/>' +
    arms + '<circle cx="203" cy="204" r="30" fill="#6e4c12" opacity=".4"/><circle cx="200" cy="200" r="28" fill="url(#rlHub)"/>' +
    '<circle cx="200" cy="200" r="19" fill="url(#rlHub)" stroke="#8a6018" stroke-width="1.2"/><circle cx="200" cy="200" r="10" fill="url(#rlKnob)"/><circle cx="196" cy="195" r="3.5" fill="#fffbe8" opacity=".9"/></g>' +
    '<circle id="rlBallEl" cx="200" cy="18" r="8" fill="url(#rlBall)"/>' +
    '<circle cx="200" cy="200" r="199" fill="url(#rlSheen)"/></svg>';
  document.body.appendChild(btn); document.body.appendChild(result);
  var wheel = btn.querySelector('#rlWheel'), ball = btn.querySelector('#rlBallEl'), hint = btn.querySelector('.hint');

  // ── sound
  var ac = null;
  function ctx() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; }
  function tick(vol, f) { var c = ac; if (!c) return; var t = c.currentTime, n = Math.ceil(c.sampleRate * .02), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * .003));
    var s = c.createBufferSource(); s.buffer = b; var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f || 3800; bp.Q.value = 2; var g = c.createGain(); g.gain.value = vol;
    s.connect(bp).connect(g).connect(master()); s.start(t); }
  var mg = null; function master() { if (!mg) { mg = ac.createGain(); mg.gain.value = .3; mg.connect(ac.destination); } return mg; }
  var BOX = [1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
  function plink(f, vol, delay) { var c = ac; if (!c) return; var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .6); o.connect(g).connect(master()); o.start(t); o.stop(t + .65); }
  function whirr(on) { var c = ac; if (!c) return null; var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; var s = c.createBufferSource(); s.buffer = b; s.loop = true; var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .7;
    var g = c.createGain(); g.gain.value = .05; s.connect(f).connect(g).connect(master()); s.start(); return { s: s, g: g }; }

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
      var drop = Math.max(0, (k - .62) / .38), r = 192 - drop * 63 + Math.sin(drop * Math.PI * 7) * (1 - drop) * 10 * (drop > 0 ? 1 : 0);
      wheel.setAttribute('transform', 'rotate(' + wAng + ' 200 200)');
      var bp = p(r, bWorld - 0); ball.setAttribute('cx', bp[0]); ball.setAttribute('cy', bp[1]);
      var rel = Math.floor((((bWorld - wAng) % 360) + 360) % 360 / STEP);
      if (drop > 0 && rel !== lastPocket) { lastPocket = rel; tick(.12 * (1 - drop * .6), 3000 + Math.random() * 1500); plink(BOX[rel % BOX.length], .015 * (1 - drop * .5)); }
      if (noise) noise.g.gain.value = .05 * (1 - k);
      if (k < 1) return requestAnimationFrame(frame);
      if (noise) { try { noise.s.stop(); } catch (e) {} }
      tick(.3, 1800); [0, 2, 4, 5].forEach(function (k, j) { plink(BOX[k] / (j === 3 ? 1 : 2), .025, .05 + j * .11); });
      result.innerHTML = '<b>' + number + '</b>' + (number === 0 ? 'green' : '') + ' off to ' + page[0];
      result.classList.add('on');
      setTimeout(function () {
        fadeOut = document.body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
        setTimeout(function () { location.href = page[1]; }, 330);
      }, still ? 600 : 1500);
    })(t0);
  }
  btn.addEventListener('click', spin);
  // Coming back with the Back button, browsers restore this page exactly as it was left: faded
  // out, mid-spin. Undo all of that so the table is there again and the wheel can spin.
  var fadeOut = null;
  addEventListener('pageshow', function (e) {
    if (fadeOut) { fadeOut.cancel(); fadeOut = null; }
    document.body.getAnimations().forEach(function (a) { a.cancel(); });
    document.body.style.opacity = '';
    spinning = false; result.classList.remove('on'); hint.style.opacity = '';
  });
})();
