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
  #pool .lamp-old{background:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(255,236,190,.16),transparent 70%),radial-gradient(ellipse 120% 100% at 50% 50%,transparent 55%,rgba(0,0,0,.45) 100%);transition:opacity 1.2s}
  #pool .lamp{position:absolute;inset:0;pointer-events:none;transition:opacity 1.2s;
    background:radial-gradient(ellipse 48% 44% at 50% 46%,rgba(255,250,232,.13),transparent 72%),
      radial-gradient(ellipse 105% 92% at 50% 46%,transparent 40%,rgba(8,5,2,.84) 100%),
      linear-gradient(rgba(255,170,90,.07),rgba(255,170,90,.07)),
      linear-gradient(180deg,rgba(6,16,48,.45),transparent 38%,transparent 70%,rgba(1,8,16,.35))}
  #pool .dof{position:absolute;inset:0;pointer-events:none;transition:opacity 1s;background:radial-gradient(ellipse 58% 54% at 50% 48%,transparent 62%,rgba(0,10,14,.35) 100%)}
  #pool .film{position:absolute;inset:-20%;pointer-events:none;opacity:.07;will-change:transform;animation:film .6s steps(4) infinite;transition:opacity 1s;
    background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")}
  @keyframes film{0%{transform:translate(0,0)}25%{transform:translate(-3%,2%)}50%{transform:translate(2%,-3%)}75%{transform:translate(-2%,-1%)}100%{transform:translate(1%,3%)}}
  #pool .flash{position:absolute;inset:0;pointer-events:none;background:#fff8e6;opacity:0}
  #pool .prompt{position:absolute;font:300 clamp(11px,1vw,13px)/1.7 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:.28em;text-transform:uppercase;color:rgba(243,238,228,.75);pointer-events:none;transition:opacity .4s;z-index:2}
  #pool .prompt b{font-family:'DM Serif Display',Georgia,serif;font-style:italic;font-weight:400;display:block;font-size:1.6em;color:#f3eee4;margin-bottom:10px;text-shadow:0 0 24px rgba(160,230,230,.25);text-transform:none;letter-spacing:.01em}
  #pool .banner{position:absolute;left:50%;top:clamp(18px,4vh,36px);transform:translateX(-50%);color:rgba(243,238,228,.72);font:300 clamp(10px,.9vw,12px) 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:.55em;text-transform:uppercase;white-space:nowrap;transition:opacity .5s,transform .5s;z-index:4;text-shadow:0 1px 8px rgba(0,0,0,.6)}
  #pool .banner span{color:#9fd8d6}
  #pool .motes{position:absolute;inset:0;pointer-events:none;transition:opacity 1.2s}
  #pool .motes i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff6dc;opacity:.0;animation:mote var(--d) linear var(--dl) infinite}
  @keyframes mote{0%{transform:translate(0,0);opacity:0}15%{opacity:.5}85%{opacity:.35}100%{transform:translate(var(--mx),var(--my));opacity:0}}
  #pool .meter{position:absolute;width:12px;height:clamp(90px,16vh,140px);border:2px solid #f1e6cf;border-radius:8px;overflow:hidden;opacity:0;transition:opacity .2s;background:rgba(18,48,32,.5)}
  #pool .meter b{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(0deg,#f3d38a,#cf4a3c)}
  #pool .meter small{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:6px;font:12px 'Nanum Pen Script',cursive;color:#f1e6cf;white-space:nowrap}
  #pool .tag{position:absolute;font:300 clamp(12px,1.1vw,14px) 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:.4em;text-transform:uppercase;color:#f3eee4;pointer-events:none;text-shadow:0 0 18px rgba(159,216,214,.5)}
  #pool .skip{position:absolute;right:clamp(18px,3vw,36px);bottom:clamp(18px,3vw,36px);font:13px 'Courier Prime',Courier,monospace;color:#f6ecd6;background:rgba(20,40,25,.45);border:1px solid rgba(246,236,214,.5);border-radius:999px;padding:6px 14px;cursor:pointer;z-index:5}
  #pool .skip:hover,#pool .skip:focus-visible{background:rgba(20,40,25,.7);outline:none}
  #pool .snd{position:absolute;right:clamp(18px,3vw,36px);bottom:calc(clamp(18px,3vw,36px) + 38px);font:13px 'Courier Prime',Courier,monospace;color:#f6ecd6;background:rgba(20,40,25,.45);border:1px solid rgba(246,236,214,.5);border-radius:999px;padding:6px 14px;cursor:pointer;z-index:5}
  #pool .shade{position:absolute;left:50%;top:0;width:min(46vw,560px);transform:translate(-50%,-42%);pointer-events:none;z-index:1;transform-origin:50% -200px;animation:sway 6s ease-in-out infinite alternate;transition:top 1.4s cubic-bezier(.6,0,.3,1),opacity 1s}
  #pool .shade.gone{top:-40vh;opacity:0}
  @keyframes sway{from{rotate:-1.6deg}to{rotate:1.6deg}}
  #pool .lamp{animation:glow 6s ease-in-out infinite alternate;will-change:transform;inset:-4% !important}
  @keyframes glow{from{transform:translateX(-2vw)}to{transform:translateX(2vw)}}
  #pool .bar{position:absolute;left:0;right:0;height:0;background:#0b0b0c;z-index:3;transition:height .35s cubic-bezier(.3,0,.2,1)}
  #pool .bar.t{top:0}#pool .bar.b{bottom:0}
  #pool.cine .bar{height:9vh}
  #pool .stamp{position:absolute;left:50%;top:46%;z-index:4;pointer-events:none;font:200 clamp(56px,9vw,130px)/1 'Inter','Helvetica Neue',Arial,sans-serif;letter-spacing:.45em;text-indent:.45em;color:#f3eee4;
    text-shadow:0 0 40px rgba(159,216,214,.55);opacity:0;transform:translate(-50%,-50%) rotate(0deg) scale(1.6)}
  #pool .pdie{cursor:pointer}

  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var NS = 'http://www.w3.org/2000/svg';
  var pageLayers = null;
  function movePage(x, y, hide) {
    // re-read each time: the table adds a few of its own layers once the page has loaded
    pageLayers = [].filter.call(document.body.children, function (e) { return e.id !== 'pool' && e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE'; });
    var t = (x || y) ? 'translate3d(' + x + 'px,' + y + 'px,0)' : '';
    for (var i = 0; i < pageLayers.length; i++) { pageLayers[i].style.transform = t; pageLayers[i].style.visibility = hide ? 'hidden' : ''; }
  }
  var pool = document.createElement('div'); pool.id = 'pool'; pool.tabIndex = 0;
  pool.setAttribute('role', 'dialog'); pool.setAttribute('aria-label', 'Opening: break the rack to get to the card table');
  pool.innerHTML = '<div class="world"><svg></svg></div><div class="dof"></div><div class="lamp"></div><div class="film"></div><div class="flash"></div>' +
    '<p class="prompt"><b>break the rack.</b>drag back to aim &amp; pull<br>then let go</p><div class="banner">sofia grimm\u2019s <span>pool hall</span> &amp; card room</div>' +
    '<div class="motes">' + Array.from({ length: 8 }, function (_, i) { return '<i style="left:' + (20 + Math.random() * 60) + '%;top:' + (15 + Math.random() * 60) + '%;--d:' + (8 + Math.random() * 8) + 's;--dl:-' + (Math.random() * 10) + 's;--mx:' + ((Math.random() - .5) * 120) + 'px;--my:' + (-40 - Math.random() * 80) + 'px"></i>'; }).join('') + '</div>' +
    '<div class="meter"><b></b><small>power</small></div><button class="skip" type="button">skip</button><button class="snd" type="button" aria-pressed="true">sound: on</button>' +
    '<div class="bar t"></div><div class="bar b"></div><div class="stamp" aria-hidden="true">BREAK</div>' +
    '<svg class="shade" viewBox="0 0 560 260" aria-hidden="true"><path d="M280 0 V60" stroke="#1a1a1a" stroke-width="5"/><path d="M40 230 Q60 90 280 70 Q500 90 520 230Z" fill="#1f5a3c"/>' +
    '<path d="M40 230 Q60 90 280 70 Q500 90 520 230Z" fill="url(#shadeHi)"/><rect x="30" y="222" width="500" height="18" rx="9" fill="#c9a45a"/><ellipse cx="280" cy="240" rx="230" ry="16" fill="#fff4d0" opacity=".85"/>' +
    '<defs><linearGradient id="shadeHi" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".3" stop-color="#fff" stop-opacity=".25"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs></svg>';
  document.body.appendChild(pool);
  document.documentElement.style.overflow = 'hidden';
  var meter = pool.querySelector('.meter'), banner = pool.querySelector('.banner'), world = pool.querySelector('.world'), svg = world.querySelector('svg'), prompt = pool.querySelector('.prompt'), flash = pool.querySelector('.flash');

  var aimLine, ghost, W, H, land, SU, SV, R, END, balls = [], eight, shooter, cue, rack, trail = [], trailEls = [], dir, pull = 0, state = 'aim';
  var RED = '#c8241d', BLUE = '#1f4fb5', CREAM = '#f3eee4', INK = '#141414', FELT = '#1b5a3c', FELT2 = '#134430', WOOD = '#3b2216', WOOD2 = '#1d100a', GOLD = '#d9c28e';
  var BALLS = ['#f2c12e', '#1f4fb5', '#c8241d', '#5b2a8c', '#f0761c', '#1d7a43', '#7a1d2a'];
  var LETTERS = ['s', 'o', 'f', 'i', 'a', 'g', 'r', 'i', 'm', 'm'];
  // travel runs along u: left-to-right on a wide screen, top-to-bottom on a tall one
  var P = function (u, v) { return land ? { x: u, y: v } : { x: v, y: u }; };
  var el = function (tag, a, parent) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; };

  // ── sound: made in the browser, only after the player has clicked
  var audio = { c: null, m: null, muted: false,
    out: function () { var c = this.c; if (!this.m) { this.m = c.createGain(); this.m.gain.value = this.muted ? 0 : 1; this.m.connect(c.destination); } return this.m; },
    mute: function (on) { this.muted = on; if (this.m) this.m.gain.setTargetAtTime(on ? 0 : 1, this.c.currentTime, .05); },
    // an upright-bass walk under the chase: quiet, plucky, a few bars of E minor
    bassT: null,
    bass: function (on) { var self = this, c = this.c; if (!c) return; clearInterval(this.bassT); if (!on) return;
      var notes = [82.4, 98, 110, 123.5, 146.8, 123.5, 110, 98, 82.4, 87.3, 98, 110, 130.8, 123.5, 110, 92.5], i = 0;
      var pluck = function (f) { var t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
        o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2; lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(220, t + .3);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .012); g.gain.exponentialRampToValueAtTime(.0005, t + .48);
        o.connect(lp); o2.connect(lp); lp.connect(g).connect(self.out()); o.start(t); o2.start(t); o.stop(t + .5); o2.stop(t + .5); };
      var brush = function () { self.noise(.09, 5200, .6, .035); };
      pluck(notes[0]); this.bassT = setInterval(function () { i++; pluck(notes[i % notes.length]); if (i % 2) brush(); }, 545); },
    init: function () { try { this.c = this.c || new (window.AudioContext || window.webkitAudioContext)(); if (this.c.state === 'suspended') this.c.resume(); } catch (e) {} },
    noise: function (dur, f, q, gain, type) { var c = this.c; if (!c) return; var n = Math.ceil(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * dur * .25));
      var s = c.createBufferSource(); s.buffer = b; var fl = c.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q; var g = c.createGain(); g.gain.value = gain;
      s.connect(fl).connect(g).connect(audio.out()); s.start(); },
    tone: function (f, dur, gain, type) { var c = this.c; if (!c) return; var o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .7, t + dur);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur); o.connect(g).connect(audio.out()); o.start(); o.stop(t + dur + .02); },
    clack: function (v) { v = Math.max(.15, Math.min(1, v)); this.noise(.04, 3000 + Math.random() * 900, 1.3, .5 * v); this.tone(1700 + Math.random() * 400, .06, .08 * v); this.tone(380, .05, .1 * v, 'triangle'); },
    cue: function () { this.noise(.05, 1400, 1, .5); this.tone(220, .08, .2, 'triangle'); },
    thump: function () { this.tone(110, .25, .35, 'sine'); this.noise(.08, 400, .7, .3, 'lowpass'); },
    rumble: null,
    roll: function (on) { var c = this.c; if (!c) return; if (on && !this.rumble) { var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; var s = c.createBufferSource(); s.buffer = b; s.loop = true; var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
        var g = c.createGain(); g.gain.value = 0; s.connect(f).connect(g).connect(audio.out()); s.start(); this.rumble = { s: s, g: g }; }
      if (!on && this.rumble) { var r = this.rumble; r.g.gain.setTargetAtTime(0, c.currentTime, .15); setTimeout(function () { try { r.s.stop(); } catch (e) {} }, 800); this.rumble = null; } },
    level: function (v) { if (this.rumble) this.rumble.g.gain.setTargetAtTime(Math.min(.22, v), this.c.currentTime, .05); }
  };

  // speckle texture drawn once to a tiny canvas; far cheaper than a live SVG noise filter
  var SPECK = (function () { var c = document.createElement('canvas'); c.width = c.height = 96; var x = c.getContext('2d');
    for (var i = 0; i < 900; i++) { x.fillStyle = 'rgba(255,255,255,' + (Math.random() * .9) + ')'; x.fillRect(Math.random() * 96, Math.random() * 96, Math.random() < .2 ? 2 : 1, 1); }
    return c.toDataURL(); })();
  function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, f = function (c) { return Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)); };
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1); }
  // light specks in the cloth (chalk dust and wear), drawn once
  var FLECK = (function () { var c = document.createElement('canvas'); c.width = c.height = 160; var x = c.getContext('2d');
    for (var i = 0; i < 70; i++) { x.fillStyle = 'rgba(190,235,205,' + (.15 + Math.random() * .35) + ')'; var r = Math.random() * 1.6 + .4; x.beginPath(); x.arc(Math.random() * 160, Math.random() * 160, r, 0, 7); x.fill(); }
    return c.toDataURL(); })();
  function defs() {
    var d = el('defs', {});
    d.innerHTML = '<pattern id="pFleck" width="160" height="160" patternUnits="userSpaceOnUse"><image href="' + FLECK + '" width="160" height="160"/></pattern>' +
      '<radialGradient id="redFelt" cx="30%" cy="45%" r="80%"><stop offset="0" stop-color="#8a2a2c" stop-opacity=".9"/><stop offset=".6" stop-color="#6e1f22" stop-opacity="0"/><stop offset="1" stop-color="#3a0c0f" stop-opacity=".6"/></radialGradient>' +
      '<linearGradient id="rackWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5434"/><stop offset=".5" stop-color="#4e331d"/><stop offset="1" stop-color="#6b4528"/></linearGradient>' +
      '<pattern id="pSpeckPat" width="96" height="96" patternUnits="userSpaceOnUse"><image href="' + SPECK + '" width="96" height="96"/></pattern>' + '<filter id="pSpeck" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="3"/>' +
      '<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.6 1.5"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<linearGradient id="pWood" x1="0" y1="0" x2="' + (land ? 0 : 1) + '" y2="' + (land ? 1 : 0) + '"><stop offset="0" stop-color="#7d4a28"/><stop offset=".5" stop-color="' + WOOD + '"/><stop offset="1" stop-color="' + WOOD2 + '"/></linearGradient>' +
      BALLS.concat(['#151515', '#efe9dc']).map(function (c, k) { return '<radialGradient id="bc' + k + '" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="' + shade(c, .45) + '"/><stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="' + shade(c, -.6) + '"/></radialGradient>'; }).join('') +
      '<linearGradient id="dieShade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a5248" stop-opacity=".35"/></linearGradient>' +
      '<radialGradient id="ballRim" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>' +
      '<radialGradient id="ballKey" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ballShadow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#011417" stop-opacity=".75"/><stop offset=".6" stop-color="#011417" stop-opacity=".35"/><stop offset="1" stop-color="#011417" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="pShine" cx="35%" cy="30%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></radialGradient>';
  }

  function makeBall(i, label, num, kind) {
    // kind: 'eight', 'cue' or a numbered ball (1-7 solid, 9-15 striped, same colours as real sets)
    var isEight = kind === 'eight', isCue = kind === 'cue', ci = isEight ? 7 : isCue ? 8 : (num - 1) % 8, stripe = !isEight && !isCue && num > 8, g = el('g', {});
    var sh = el('ellipse', { cx: R * .62, cy: R * .82, rx: R * 1.5, ry: R * 1.02, fill: 'url(#ballShadow)', transform: 'rotate(28 ' + (R * .62) + ' ' + (R * .82) + ')' }, g);
    var body = el('g', {}, g), spin = el('g', {}, body);
    var cp = el('clipPath', { id: 'pc' + i }, svg.querySelector('defs')); el('circle', { r: R }, cp);
    if (stripe) { el('circle', { r: R, fill: 'url(#bc8)' }, spin); el('rect', { x: -R, y: -R * .5, width: R * 2, height: R, fill: 'url(#bc' + ci + ')', 'clip-path': 'url(#pc' + i + ')' }, spin); }
    else el('circle', { r: R, fill: 'url(#bc' + ci + ')' }, spin);
    var lab = el('g', {}, spin), lc = el('g', {}, lab);
    if (isCue) { el('circle', { r: R * .09, fill: '#c8241d', opacity: .85 }, lc); }
    else {
      el('circle', { r: R * .44, fill: '#f7f4ee' }, lc);
      var t = el('text', { 'text-anchor': 'middle', y: R * .19, 'font-family': "'Inter','Helvetica Neue',Arial,sans-serif", 'font-weight': 700, 'font-size': R * (label.length > 1 ? .42 : .52), fill: '#111' }, lc); t.textContent = label;
    }
    el('circle', { r: R, fill: 'url(#ballRim)' }, body);
    el('ellipse', { cx: -R * .34, cy: -R * .4, rx: R * .42, ry: R * .3, fill: 'url(#ballKey)', transform: 'rotate(-28 ' + (-R * .34) + ' ' + (-R * .4) + ')', opacity: .75 }, body);
    el('circle', { cx: -R * .4, cy: -R * .46, r: R * .09, fill: '#fff', opacity: .95 }, body);
    el('path', { d: 'M' + (R * .1) + ' ' + (R * .9) + ' A' + R * .95 + ' ' + R * .95 + ' 0 0 0 ' + (R * .86) + ' ' + (R * .3), fill: 'none', stroke: '#a9dcb8', 'stroke-width': R * .08, opacity: .3 }, body);
    return { g: g, sh: sh, body: body, spin: spin, lab: lab, x: 0, y: 0, vx: 0, vy: 0, a: 0, ph: 0, hd: 0, lift: 0, eight: isEight };
  }

  function rectUV(u0, v0, du, dv, attrs) { var a = P(u0, v0), b = P(u0 + du, v0 + dv); attrs.x = Math.min(a.x, b.x); attrs.y = Math.min(a.y, b.y); attrs.width = Math.abs(b.x - a.x); attrs.height = Math.abs(b.y - a.y); return el('rect', attrs); }

  function drawTable() {
    // the pool table runs three screens long; past its foot rail the world is empty,
    // so the real card table (the Projects page) shows through
    var rail = R * 2.1, cush = R * .45;
    var tail = (land ? 4.6 : 4.6) * SU;
    rectUV(END - R, 0, tail - END + R, SV, { fill: '#6e1f22' });
    rectUV(END - R, 0, tail - END + R, SV, { fill: 'url(#redFelt)' });
    rectUV(0, 0, END, SV, { fill: FELT });
    rectUV(0, 0, END, SV, { fill: 'url(#pFleck)', opacity: '.55' });
    rectUV(0, SV * .2, END, SV * .6, { fill: '#2c7a52', opacity: '.16' });
    rectUV(0, 0, END, rail, { fill: 'url(#pWood)' }); rectUV(0, SV - rail, END, rail, { fill: 'url(#pWood)' });
    rectUV(0, 0, rail, SV, { fill: 'url(#pWood)' }); rectUV(END - rail, 0, rail, SV, { fill: 'url(#pWood)' });
    rectUV(rail, rail, END - 2 * rail, cush, { fill: FELT2 }); rectUV(rail, SV - rail - cush, END - 2 * rail, cush, { fill: FELT2 });
    rectUV(rail, rail, cush, SV - 2 * rail, { fill: FELT2 }); rectUV(END - rail - cush, rail, cush, SV - 2 * rail, { fill: FELT2 });
    // a dark lip where the cloth meets the foot rail, so the hop reads
    rectUV(END - rail - cush - R * .2, rail, R * .2, SV - 2 * rail, { fill: '#05363a', opacity: '.7' });
    for (var k = 1; k < 12; k++) { if (k % 4 === 0) continue; [rail * .5, SV - rail * .5].forEach(function (v) { var p = P(k * END / 12, v), s = R * .2;
      el('path', { d: 'M' + (p.x - s) + ' ' + p.y + ' L' + p.x + ' ' + (p.y - s) + ' L' + (p.x + s) + ' ' + p.y + ' L' + p.x + ' ' + (p.y + s) + 'Z', fill: CREAM, opacity: '.85' }); }); }
    [[rail * .55, rail * .55], [END / 2, rail * .4], [END - rail * .55, rail * .55], [rail * .55, SV - rail * .55], [END / 2, SV - rail * .4], [END - rail * .55, SV - rail * .55]].forEach(function (q) { var p = P(q[0], q[1]); el('circle', { cx: p.x, cy: p.y, r: R * 1.15, fill: '#0f0f10' }); });
    var h0 = P(SU * .78, rail), h1 = P(SU * .78, SV - rail); el('line', { x1: h0.x, y1: h0.y, x2: h1.x, y2: h1.y, stroke: CREAM, 'stroke-width': 1.5, opacity: '.25', 'stroke-dasharray': '6 8' });
    var cap = function (u, v, txt, size, font, fill, rot, op) { var p = P(u, v), t = el('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'font-family': font, 'font-size': size, fill: fill, opacity: op, transform: 'rotate(' + rot + ' ' + p.x + ' ' + p.y + ')' }); t.textContent = txt; };
    var m = Math.min(SU, SV);
    cap(SU * 1.3, SV * .76, 'sofia grimm\u2019s card table', m * .075, "'DM Serif Display',Georgia,serif", GOLD, -3, .22);
    cap(SU * 2.35, SV * .3, 'THIS WAY TO THE CARDS', m * .03, "'Inter','Helvetica Neue',Arial,sans-serif", CREAM, 0, .35);
    var a0 = P(SU * 2.62, SV * .4), a1 = P(SU * 2.84, SV * .4), hs = m * .025;
    el('path', { d: 'M' + a0.x + ' ' + a0.y + ' L' + a1.x + ' ' + a1.y, stroke: CREAM, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: '.35' });
    var hp = land ? 'M' + (a1.x - hs) + ' ' + (a1.y - hs) + ' L' + a1.x + ' ' + a1.y + ' L' + (a1.x - hs) + ' ' + (a1.y + hs) : 'M' + (a1.x - hs) + ' ' + (a1.y - hs) + ' L' + a1.x + ' ' + a1.y + ' L' + (a1.x + hs) + ' ' + (a1.y - hs);
    el('path', { d: hp, fill: 'none', stroke: CREAM, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: '.35' });
  }

  function props() {
    var s = Math.min(SU, SV) / 900, g = el('g', {});
    var put = function (u, v, rot, html) { var p = P(u, v), e = el('g', { transform: 'translate(' + p.x + ' ' + p.y + ') rotate(' + rot + ') scale(' + s + ')' }, g); e.innerHTML = html; };
    var spk = function (w, h, r) { return '<rect width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" fill="url(#pSpeckPat)" opacity=".38"/>'; };
    var die = function (u, v, rot, pips) { var h = '<g class="pdie"><rect x="5" y="6" width="56" height="56" rx="8" fill="#03262a" opacity=".55"/><rect width="56" height="56" rx="8" fill="#f1ece2"/><rect width="56" height="56" rx="8" fill="url(#dieShade)"/>'; pips.forEach(function (q) { h += '<circle class="pp" cx="' + q[0] + '" cy="' + q[1] + '" r="5.5" fill="' + INK + '"/>'; }); put(u, v, rot, h + '</g>'); };
    die(SU * .64, SV * .84, 14, [[28, 28]]); die(SU * .71, SV * .77, -10, [[16, 14], [40, 14], [16, 28], [40, 28], [16, 42], [40, 42]]);
    put(SU * .2, SV * .78, 18, '<rect x="8" y="10" width="54" height="54" rx="4" fill="#011417" opacity=".45"/><rect width="54" height="54" rx="4" fill="#2a6fb0"/><rect x="3" y="3" width="48" height="20" rx="3" fill="#fff" opacity=".12"/><rect x="12" y="12" width="30" height="30" rx="3" fill="#1d5a95"/>');
    var c0 = P(SU * 1.75, SV * .18), c1 = P(SU * 2.55, SV * .24);
    el('line', { x1: c0.x + 6, y1: c0.y + 8, x2: c1.x + 6, y2: c1.y + 8, stroke: '#03262a', 'stroke-width': R * .55, 'stroke-linecap': 'round', opacity: '.5' }, g);
    el('line', { x1: c0.x, y1: c0.y, x2: c1.x, y2: c1.y, stroke: '#b98b55', 'stroke-width': R * .4, 'stroke-linecap': 'round' }, g);
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
    [1, 2, 3, 4, 5].forEach(function (n, r) { for (var k = 0; k < n; k++) pos.push(P(apexU + r * gap * .87, midV + (k - (n - 1) / 2) * gap)); });
    var c1 = P(apexU - R * 1.7, midV), back = apexU + 4 * gap * .87 + R * 1.5, half = 2 * gap + R * 1.7, c2 = P(back, midV + half), c3 = P(back, midV - half);
    rack = el('g', {});
    var tri = 'M' + c1.x + ' ' + c1.y + ' L' + c2.x + ' ' + c2.y + ' L' + c3.x + ' ' + c3.y + 'Z';
    el('path', { d: tri, fill: 'none', stroke: '#03262a', 'stroke-width': R * .9, 'stroke-linejoin': 'round', opacity: '.55', transform: 'translate(' + R * .25 + ' ' + R * .3 + ')' }, rack);
    el('path', { d: tri, fill: 'none', stroke: 'url(#rackWood)', 'stroke-width': R * .8, 'stroke-linejoin': 'round' }, rack);
    el('path', { d: tri, fill: 'none', stroke: '#b08458', 'stroke-width': R * .1, 'stroke-linejoin': 'round', opacity: '.5', transform: 'translate(' + (-R * .1) + ' ' + (-R * .12) + ')' }, rack);
    var a0 = P(SU * .25 + R * 1.4, midV), a1 = P(apexU - R * 1.2, midV), aimLen = (apexU - R * 2.05) - SU * .25;
    aimLine = el('line', { x1: a0.x, y1: a0.y, x2: a1.x, y2: a1.y, stroke: CREAM, 'stroke-width': 2, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round', opacity: .25 }); aimLine.dataset.len = aimLen;
    var gh = P(apexU - R * 2.05, midV); ghost = el('circle', { cx: gh.x, cy: gh.y, r: R, fill: 'none', stroke: CREAM, 'stroke-width': 1.5, 'stroke-dasharray': '4 5', opacity: .4 });
    trailEls = []; for (var t = 0; t < 10; t++) trailEls.push(el('circle', { r: R * (1 - t * .06), fill: INK, opacity: 0 }));
    // rack order (point first): 8 · s o · f i a · g r i m · m 4 13 6 15 — "sofia grimm" reads row by row
    var RACK = [['8', 8, 'eight'], ['s', 1], ['o', 10], ['f', 3], ['i', 12], ['a', 5], ['g', 14], ['r', 7], ['i', 9], ['m', 2], ['m', 11], ['4', 4], ['13', 13], ['6', 6], ['15', 15]];
    balls = RACK.map(function (r, i) { var b = makeBall(i, r[0], r[1], r[2]); b.x = pos[i].x; b.y = pos[i].y; return b; });
    eight = balls[0];
    shooter = makeBall(99, '', 0, 'cue'); var e0 = P(SU * .25, midV); shooter.x = e0.x; shooter.y = e0.y; balls.push(shooter);
    dir = land ? { x: 1, y: 0 } : { x: 0, y: 1 };
    cue = el('g', {}); var L = Math.max(W, H) * .7;
    el('rect', { x: -L, y: -R * .32 + R * .3, width: L, height: R * .64, fill: '#03262a', opacity: '.55', transform: 'translate(' + R * .2 + ' 0)' }, cue);
    el('rect', { x: -L, y: -R * .26, width: L, height: R * .52, rx: R * .26, fill: '#c99b5e' }, cue);
    el('rect', { x: -L, y: -R * .34, width: L * .35, height: R * .68, rx: R * .34, fill: '#7a4a2a' }, cue);
    el('rect', { x: -R * .9, y: -R * .26, width: R * .9, height: R * .52, fill: CREAM }, cue);
    el('rect', { x: -R * .25, y: -R * .26, width: R * .25, height: R * .52, rx: R * .1, fill: BLUE }, cue);
    var pp = land ? { left: shooter.x - W * .2, top: shooter.y + R * 2.4 } : { left: W * .08, top: shooter.y + R * 2.4 };
    prompt.style.left = pp.left + 'px'; prompt.style.top = pp.top + 'px';
    meter.style.left = (land ? shooter.x - W * .27 : W * .9) + 'px'; meter.style.top = (land ? shooter.y - H * .12 : shooter.y - H * .05) + 'px';
    cam = { u: 0, shake: 0, z: 1 }; pageParked = false; setCamera(); draw();
  }

  var pageParked = false, fxOff = false;
  function setCamera() {
    var sx = (Math.random() - .5) * cam.shake, sy = (Math.random() - .5) * cam.shake, off = P(-cam.u, 0), z = cam.z || 1, f = cam.f || { x: W / 2, y: H / 2 };
    world.style.transform = 'translate3d(' + f.x + 'px,' + f.y + 'px,0) scale(' + z + ') translate3d(' + (off.x + sx - f.x) + 'px,' + (off.y + sy - f.y) + 'px,0)';
    var dist = END - cam.u;
    if (dist > SU * 1.05) return;
    // as the card table comes into view, drop the costly lens blur and film grain first,
    // so the slide onto the table is just two flat layers moving together
    if (!fxOff) { fxOff = true; ['.dof', '.film'].forEach(function (q) { var e = pool.querySelector(q); if (!e) return;
      e.animate([{ opacity: getComputedStyle(e).opacity }, { opacity: 0 }], { duration: 500, fill: 'forwards' }).finished.then(function () { e.style.display = 'none'; }); }); }
  }

  function draw() {
    balls.forEach(function (b) {
      if (b === pocketBall && pocketed) return;
      b.g.setAttribute('transform', 'translate(' + b.x + ' ' + b.y + ')');
      b.body.setAttribute('transform', 'translate(0 ' + (-b.lift * R * 1.3) + ') scale(' + (1 + b.lift * .35) + ')');
      b.sh.setAttribute('transform', 'scale(' + (1 - b.lift * .25) + ')'); b.sh.setAttribute('opacity', .6 - b.lift * .3);
      // rolling: the label slides over the top of the ball and round the back
      var c = Math.cos(b.ph), sn = Math.sin(b.ph), hd = b.hd * 180 / Math.PI;
      b.lab.setAttribute('transform', 'rotate(' + hd + ') translate(' + (sn * R * .62) + ' 0) scale(' + Math.max(.08, Math.abs(c)) + ' 1) rotate(' + (-hd) + ')');
      b.lab.setAttribute('opacity', c > 0 ? 1 : 0);
    });
    trailEls.forEach(function (t, i) { var p = trail[trail.length - 1 - (i + 1) * 2]; if (!p) { t.setAttribute('opacity', 0); return; }
      t.setAttribute('cx', p.x); t.setAttribute('cy', p.y); t.setAttribute('opacity', Math.max(0, .22 - i * .022) * Math.min(1, p.s / (R * .5))); });
    var back = R + 6 + pull;
    if (aimLine && state === 'aim') { var k = pull / (Math.min(W, H) * .2); aimLine.setAttribute('opacity', .25 + k * .5); meter.querySelector('b').style.height = (k * 100) + '%'; }
    if (cue) cue.setAttribute('transform', 'translate(' + (shooter.x - dir.x * back) + ' ' + (shooter.y - dir.y * back) + ') rotate(' + (Math.atan2(dir.y, dir.x) * 180 / Math.PI) + ')');
    if (aimLine && state === 'aim') { var reach = Math.hypot(+aimLine.dataset.len || 0, 0); aimLine.setAttribute('x1', shooter.x + dir.x * R * 1.4); aimLine.setAttribute('y1', shooter.y + dir.y * R * 1.4);
      aimLine.setAttribute('x2', shooter.x + dir.x * reach); aimLine.setAttribute('y2', shooter.y + dir.y * reach);
      ghost.setAttribute('cx', shooter.x + dir.x * (reach + R * .85)); ghost.setAttribute('cy', shooter.y + dir.y * (reach + R * .85)); }
  }

  var dragFrom = null, maxPull;
  pool.querySelector('.snd').addEventListener('click', function (e) { audio.init(); var on = audio.muted; audio.mute(!on); e.currentTarget.textContent = 'sound: ' + (on ? 'on' : 'off'); e.currentTarget.setAttribute('aria-pressed', on); });
  // the dice on the pool table roll too
  var PIP = { 1: [[28, 28]], 2: [[16, 16], [40, 40]], 3: [[16, 16], [28, 28], [40, 40]], 4: [[16, 16], [40, 16], [16, 40], [40, 40]], 5: [[16, 16], [40, 16], [28, 28], [16, 40], [40, 40]], 6: [[16, 14], [40, 14], [16, 28], [40, 28], [16, 42], [40, 42]] };
  function rollDie(g) { if (g.__rolling) return; g.__rolling = true; var t0 = performance.now(), base = g.getAttribute('transform') || '', sp = (Math.random() < .5 ? -1 : 1) * (540 + Math.random() * 360);
    (function f(now) { var k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3), hop = Math.abs(Math.sin(k * Math.PI * 2.5)) * (1 - k) * 30;
      g.setAttribute('transform', base + ' translate(28 28) rotate(' + (sp * e) + ') translate(' + (-28) + ' ' + (-28 - hop) + ')');
      if (k < .85 && Math.random() < .3) { var v = 1 + Math.floor(Math.random() * 6), pips = g.querySelectorAll('.pp'); pips.forEach(function (p) { p.remove(); }); PIP[v].forEach(function (q) { el('circle', { cx: q[0], cy: q[1], r: 5.5, fill: INK, class: 'pp' }, g); }); }
      if (Math.abs(Math.sin(k * Math.PI * 2.5)) < .08 && k > .1) audio.clack(.3 * (1 - k) + .1);
      if (k < 1) requestAnimationFrame(f); else { g.setAttribute('transform', base); g.__rolling = false; } })(t0); }
  pool.addEventListener('click', function (e) { var d = e.target.closest && e.target.closest('.pdie'); if (d) { audio.init(); rollDie(d); } });
  pool.addEventListener('pointerdown', function (e) {
    audio.init();
    if (state !== 'aim' || e.target.classList.contains('skip') || e.target.classList.contains('snd') || (e.target.closest && e.target.closest('.pdie'))) return;
    dragFrom = { x: e.clientX, y: e.clientY }; maxPull = Math.min(W, H) * .2; pool.classList.add('aiming'); meter.style.opacity = 1; pool.setPointerCapture(e.pointerId);
  });
  pool.addEventListener('pointermove', function (e) { if (!dragFrom) return; var dx = e.clientX - dragFrom.x, dy = e.clientY - dragFrom.y, len = Math.hypot(dx, dy);
    pull = Math.max(0, Math.min(maxPull, len));
    // pulling back points the cue the other way; it can swing a little either side of the rack
    if (len > 14) { var base = land ? 0 : Math.PI / 2, ang = Math.atan2(-dy, -dx) - base; ang = Math.atan2(Math.sin(ang), Math.cos(ang)); ang = Math.max(-.09, Math.min(.09, ang)) + base; dir = { x: Math.cos(ang), y: Math.sin(ang) }; }
    draw(); });
  pool.addEventListener('pointerup', function () { if (!dragFrom) return; dragFrom = null; pool.classList.remove('aiming'); shoot(Math.max(.5, pull / maxPull)); });
  pool.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && state === 'aim') { e.preventDefault(); audio.init(); shoot(.8); } });

  function shoot(power) {
    if (state !== 'aim') return; state = 'strike'; prompt.style.opacity = 0; meter.style.opacity = 0; banner.style.opacity = 0; banner.style.transform = 'translateX(-50%) translateY(-20px)';
    [aimLine, ghost].forEach(function (x) { x.animate([{ opacity: x.getAttribute('opacity') }, { opacity: 0 }], { duration: 200, fill: 'forwards' }); });
    var from = pull, t0 = performance.now();
    (function thrust(now) {
      var k = Math.min(1, (now - t0) / 110); pull = from * (1 - k) - R * .2 * k; draw();
      if (k < 1) return requestAnimationFrame(thrust);
      audio.cue();
      for (var i = 0; i < 8; i++) { var a = Math.PI + (Math.random() - .5) * 1.6 + (land ? 0 : Math.PI / 2), d = R * (.6 + Math.random() * 1.4), c0 = { x: shooter.x - dir.x * R, y: shooter.y - dir.y * R };
        var pf = el('circle', { cx: c0.x, cy: c0.y, r: R * .12, fill: BLUE, opacity: .85 });
        pf.animate([{ transform: 'translate(0,0)', opacity: .85 }, { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px)', opacity: 0 }], { duration: 600, easing: 'ease-out', fill: 'forwards' }); }
      var sp = Math.min(W, H) * .05 * (.6 + power); shooter.vx = dir.x * sp; shooter.vy = dir.y * sp; state = 'break';
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
          b.x += b.vx * dt / 6; b.y += b.vy * dt / 6; var f = Math.pow(.9965, dt / 6); b.vx *= f; b.vy *= f; var spd = Math.hypot(b.vx, b.vy); b.ph += spd * dt / 6 / R; if (spd > .05) b.hd = Math.atan2(b.vy, b.vx);
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
              if (!impactAt) { impactAt = now; burst((A.x + B.x) / 2, (A.y + B.y) / 2); cam.shake = R * .7; slow = .25; pool.classList.add('cine');
                pool.querySelector('.stamp').animate([{ opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg) scale(1.7)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', offset: .18 },
                  { opacity: 1, transform: 'translate(-50%,-50%) rotate(0deg) scale(1.02)', offset: .7 }, { opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg) scale(1.1)' }], { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }); var ip = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }; cam.f = { x: ip.x, y: ip.y }; } }
          }
        }
      }
      if (!impactAt && state === 'break' && now - (physics.t0 || (physics.t0 = now)) > 2600) { impactAt = now; }
      if (impactAt) { var since = now - impactAt; cam.z = 1 + .22 * Math.max(0, Math.sin(Math.min(1, since / 1100) * Math.PI)); if (since > 550) slow = Math.min(1, slow + .03); cam.shake *= .9; if (since > 1200 && state === 'break') cruise(now); }
      trail.push({ x: eight.x, y: eight.y, s: Math.hypot(eight.vx, eight.vy) || trailSpeed }); if (trail.length > 30) trail.shift();
      if (state === 'cruise') { cruiseStep(now); pocketStep(now); }
      setCamera(); draw();
      if (state !== 'gone') requestAnimationFrame(step);
    })(performance.now());
  }

  // after the break the camera follows the 8 ball: off the near cushion, the length of
  // the table, over the foot rail and onto the card table, then the ball rolls away
  var path, legs, legIdx = 0, legT0 = 0, bounced = false, landed = false, trailSpeed = 0;
  function cruise(now) {
    state = 'cruise'; audio.roll(true); audio.bass(true); pool.classList.remove('cine'); pool.querySelector('.shade').classList.add('gone');
    var wall = R * 2.1 + R * .45 + R, b0 = land ? { u: eight.x, v: eight.y } : { u: eight.y, v: eight.x };
    path = [b0, { u: SU * 1.6, v: wall }, { u: END - R * 2.8, v: SV * .6 }, { u: END + SU * .32, v: SV * .64 }, { u: END + SU * 1.5, v: SV * .7 }];
    legs = [{ d: 3000, e: 'out' }, { d: 4300, e: 'lin' }, { d: 1400, e: 'hop' }, { d: 1500, e: 'lin' }];
    legIdx = 0; legT0 = now;
    var cand = balls.filter(function (b) { return b !== eight && b !== shooter; }).sort(function (a, b) { return (land ? b.x - a.x : b.y - a.y); })[0];
    pocketBall = cand; pocketBall.vx = pocketBall.vy = 0; pocketFrom = { x: cand.x, y: cand.y }; pocketT0 = now + 900;
    var pk = P(END / 2, SV - R * 2.1 * .4); pocketAt = { x: pk.x, y: pk.y };
  }
  var pocketBall = null, pocketFrom, pocketAt, pocketT0, pocketed = false;
  function pocketStep(now) {
    if (!pocketBall || pocketed) return; var t = (now - pocketT0) / 2800; if (t < 0) return;
    var k = Math.min(1, t), e = 1 - Math.pow(1 - k, 2);
    var nx = pocketFrom.x + (pocketAt.x - pocketFrom.x) * e, ny = pocketFrom.y + (pocketAt.y - pocketFrom.y) * e;
    pocketBall.ph += Math.hypot(nx - pocketBall.x, ny - pocketBall.y) / R; pocketBall.hd = Math.atan2(ny - pocketBall.y, nx - pocketBall.x); pocketBall.x = nx; pocketBall.y = ny;
    if (k >= 1) { pocketed = true; audio.tone(160, .3, .3); audio.noise(.12, 600, .7, .25, 'lowpass');
      pocketBall.g.animate([{ transform: 'translate(' + nx + 'px,' + ny + 'px) scale(1)', opacity: 1 }, { transform: 'translate(' + nx + 'px,' + ny + 'px) scale(.2)', opacity: 0 }], { duration: 260, fill: 'forwards' });
      var tag = document.createElement('div'); tag.className = 'tag'; tag.textContent = 'nice shot.'; pool.appendChild(tag);
      var sp = pocketAt, scr = P(0, 0), off = P(-cam.u, 0); tag.style.left = (sp.x + off.x - 40) + 'px'; tag.style.top = (sp.y + off.y - 70) + 'px';
      tag.animate([{ transform: 'translateY(10px) rotate(-6deg)', opacity: 0 }, { transform: 'translateY(-10px) rotate(-6deg)', opacity: 1, offset: .2 }, { transform: 'translateY(-40px) rotate(-6deg)', opacity: 0 }], { duration: 1800, fill: 'forwards' }); }
  }
  function cruiseStep(now) {
    var leg = legs[legIdx], t = Math.min(1, (now - legT0) / leg.d), a = path[legIdx], b = path[legIdx + 1];
    var k = leg.e === 'out' ? 1 - Math.pow(1 - t, 1.5) : t;
    var u = a.u + (b.u - a.u) * k, v = a.v + (b.v - a.v) * k, q = P(u, v), sp = Math.hypot(q.x - eight.x, q.y - eight.y);
    trailSpeed = sp; eight.ph += sp / R; if (sp > .05) eight.hd = Math.atan2(q.y - eight.y, q.x - eight.x); eight.x = q.x; eight.y = q.y;
    eight.lift = leg.e === 'hop' && t < .82 ? Math.sin(Math.PI * t / .82) : 0;
    audio.level(sp * .012 * (eight.lift > .1 ? .15 : 1));
    // time-based easing so the camera is just as smooth at any frame rate; once the ball is over
    // the rail the camera heads straight for the card table and settles there
    var cdt = Math.min(.1, (now - (cam.t || now)) / 1000); cam.t = now;
    var tgt = legIdx >= 2 ? END : Math.max(0, Math.min(END, u - SU * .42)), rate = legIdx >= 2 ? 3.2 : 2.6;
    cam.u += (tgt - cam.u) * (1 - Math.exp(-rate * cdt));
    if (legIdx === 0 && t >= 1 && !bounced) { bounced = true; audio.clack(.6); cam.shake = R * .15; }
    if (legIdx === 2 && t > .82 && !landed) { landed = true; audio.thump(); cam.shake = R * .3;
      pool.querySelector('.lamp').style.opacity = 0; pool.querySelector('.dof').style.opacity = 0; pool.querySelector('.film').style.opacity = 0; pool.querySelector('.motes').style.opacity = 0;
      document.querySelectorAll('#memoryGrid .card-scene').forEach(function (sc, i) { sc.animate([{ translate: '0 0' }, { translate: '0 -22px' }, { translate: '0 0' }], { duration: 520, delay: 250 + i * 70, easing: 'cubic-bezier(.3,1.4,.5,1)' }); }); }
    if (t >= 1) { legIdx++; legT0 = now; if (legIdx >= legs.length) { legIdx = legs.length - 1; legT0 = now - leg.d; if (END - cam.u < 2) finish(); } }
  }

  function cleanup() {
    document.documentElement.classList.remove('pool-moving');
    document.documentElement.style.overflow = ''; pool.remove(); st.remove();
  }
  function finish() {
    audio.bass(false);
    if (state === 'gone') return; state = 'gone'; audio.roll(false); sessionStorage.setItem('sg-pool-done', '1');
    var from = cam.u, t0 = performance.now(), d = Math.min(700, Math.abs(END - from) * 1.2 + 1);
    (function settle(now) { var k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 3); cam.u = from + (END - from) * e; cam.shake = 0; setCamera();
      if (k < 1) return requestAnimationFrame(settle);
      pool.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-in-out', fill: 'forwards' }).finished.then(cleanup); })(t0);
  }
  pool.querySelector('.skip').addEventListener('click', function () {
    audio.bass(false);
    state = 'gone'; audio.roll(false); sessionStorage.setItem('sg-pool-done', '1');
    pool.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(cleanup);
  });

  document.documentElement.classList.add('pool-moving');
  build(); pool.focus();
  addEventListener('resize', function () { if (state === 'aim') build(); });
})();
