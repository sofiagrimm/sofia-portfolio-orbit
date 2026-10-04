// Living paintings, done the way face-animation demos do it:
//  1. MediaPipe Face Mesh finds 478 points on the sitter's face (eyelids, irises, brows, lips,
//     the face outline) — it works well on painted faces.
//  2. The painting is drawn as a fine grid of triangles. Expressions and head movement are made by
//     moving the grid near the right landmarks (mouth corners, cheeks, lids, brows, the whole head
//     pivoting at the chin), with smooth falloff so nothing tears.
//  3. The irises move inside a mask cut exactly to each eye's opening, so only the eye itself
//     follows you — never the skin around it.
//  4. The figure sits in front of the background, so it shifts a little more as you move: depth.
(function () {
  var FM_VER = '0.4.1633559619', FM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@' + FM_VER + '/';
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── face finding (one Face Mesh, one painting at a time; results remembered) ──
  var fmReady = null, queue = Promise.resolve();
  function loadFM() {
    if (fmReady) return fmReady;
    fmReady = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = FM_URL + 'face_mesh.js'; s.crossOrigin = 'anonymous';
      s.onload = function () {
        try {
          var fm = new FaceMesh({ locateFile: function (f) { return FM_URL + f; } });
          fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, staticImageMode: true, minDetectionConfidence: .3 });
          fm.initialize().then(function () { res(fm); }, rej);
        } catch (e) { rej(e); }
      };
      s.onerror = rej; document.head.appendChild(s);
    });
    return fmReady;
  }
  // one detector, one painting at a time; the very first call can come back empty while the model
  // is still warming up, so each painting gets a few tries
  var pending = null;
  function detectOnce(fm, cv) {
    return new Promise(function (res) {
      pending = res;
      fm.send({ image: cv }).catch(function () { if (pending === res) { pending = null; res(null); } });
      setTimeout(function () { if (pending === res) { pending = null; res(null); } }, 20000);
    });
  }
  function findFace(img, key) {
    var ck = 'sg-mesh-v2-' + key;
    try { var c = JSON.parse(localStorage.getItem(ck) || 'null'); if (c) return Promise.resolve(c); } catch (e) {}
    var job = queue.then(function () {
      return loadFM().then(function (fm) {
        if (!fm.__wired) { fm.__wired = true; fm.onResults(function (r) { var L = (r.multiFaceLandmarks || [])[0], p = pending; pending = null;
          if (p) p(L ? L.map(function (q) { return [+q.x.toFixed(5), +q.y.toFixed(5)]; }) : null); }); }
        var W = img.naturalWidth, H = img.naturalHeight, s = Math.min(1, 1024 / Math.max(W, H));
        var cv = document.createElement('canvas'); cv.width = Math.round(W * s); cv.height = Math.round(H * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        var attempt = function (n) { return detectOnce(fm, cv).then(function (L) { if (L || n <= 1) return L; return new Promise(function (r) { setTimeout(r, 600); }).then(function () { return attempt(n - 1); }); }); };
        return attempt(3);
      });
    }).then(function (L) { if (L) try { localStorage.setItem(ck, JSON.stringify(L)); } catch (e) {} return L; }, function () { return null; });
    queue = job.catch(function () {});
    return job;
  }

  // ── WebGL ──
  var VS = 'attribute vec2 aPos;attribute vec2 aUv;varying vec2 vUv;void main(){vUv=aUv;gl_Position=vec4(aPos.x*2.-1.,1.-aPos.y*2.,0.,1.);}';
  var FS = 'precision mediump float;varying vec2 vUv;uniform sampler2D uTex,uMask;uniform vec2 uLook;uniform float uIris,uAR,uHasMask;' +
    'void main(){vec2 uv=vUv;if(uHasMask>.5){float m=texture2D(uMask,uv).r;uv-=vec2(uLook.x,uLook.y*uAR)*uIris*.38*m;}gl_FragColor=texture2D(uTex,clamp(uv,0.,1.));}';
  var OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
  var EYE_L = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246], EYE_R = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];

  var all = [], mouse = { x: innerWidth / 2, y: innerHeight / 2 }, raf = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick(now) { raf = 0; var again = false; all.forEach(function (L) { if (L.step(now)) again = true; }); if (again) kick(); }
  addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; kick(); }, { passive: true });
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', function () { all.forEach(function (L) { L.size(); }); kick(); });

  window.LivingMesh = function (cv, url, key, fallbackFig, mode) {
    mode = mode || 'face';
    var gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: true }); if (!gl) return null;
    var sh = function (t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    var U = function (n) { return gl.getUniformLocation(pr, n); };
    var GX = 90, GY = 90, NV = (GX + 1) * (GY + 1);
    var base = new Float32Array(NV * 2), pos = new Float32Array(NV * 2), idx = [];
    for (var j = 0; j <= GY; j++) for (var i = 0; i <= GX; i++) { var k = j * (GX + 1) + i; base[k * 2] = i / GX; base[k * 2 + 1] = j / GY; }
    for (j = 0; j < GY; j++) for (i = 0; i < GX; i++) { var a = j * (GX + 1) + i, b = a + 1, c = a + GX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    var bUv = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bUv); gl.bufferData(gl.ARRAY_BUFFER, base, gl.STATIC_DRAW);
    var lUv = gl.getAttribLocation(pr, 'aUv'); gl.enableVertexAttribArray(lUv); gl.vertexAttribPointer(lUv, 2, gl.FLOAT, false, 0, 0);
    var bPos = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferData(gl.ARRAY_BUFFER, base, gl.DYNAMIC_DRAW);
    var lPos = gl.getAttribLocation(pr, 'aPos'); gl.enableVertexAttribArray(lPos); gl.vertexAttribPointer(lPos, 2, gl.FLOAT, false, 0, 0);
    var bIdx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    var tex = gl.createTexture(), maskTex = gl.createTexture();
    var setTex = function (t, unit, src) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); };
    gl.uniform1i(U('uTex'), 0); gl.uniform1i(U('uMask'), 1);

    var L = { ready: false, ar: 1, P: null, mood: 0, moodT: 0, look: [0, 0], par: [0, 0], last: 0, hasMask: 0, iris: 0 };
    var F = 0, C = {}, fig = fallbackFig || [.5, .55, .35, .45], faceW = null, T0 = performance.now();
    L.setMood = function (v) { L.moodT = v; kick(); };
    L.size = function () { var r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(2, r.width * dpr); cv.height = Math.max(2, r.height * dpr); gl.viewport(0, 0, cv.width, cv.height); };

    function prepare(Lm) {
      // work in an even-scaled space (x stretched by the aspect ratio) so circles stay circles
      var X = function (n) { return [Lm[n][0] * L.ar, Lm[n][1]]; };
      L.P = X; F = Math.hypot(X(454)[0] - X(234)[0], X(454)[1] - X(234)[1]);
      C = { mL: X(61), mR: X(291), lipU: X(13), lipD: X(14), chL: X(205), chR: X(425), lidL: X(145), lidR: X(374),
        bOutL: X(70), bOutR: X(300), bMidL: X(105), bMidR: X(334), bInL: X(107), bInR: X(336), nose: X(1), chin: X(152), top: X(10) };
      var faceC = [(C.top[0] + C.chin[0]) / 2, (C.top[1] + C.chin[1]) / 2];
      fig = [faceC[0] / L.ar, Math.min(.9, C.chin[1] + F * 1.1), F * 1.5 / L.ar, F * 2.4];
      L.faceC = faceC;
      // eye-opening mask, drawn from the eyelid outline and softened a touch
      var mc = document.createElement('canvas'), MW = 1024, MH = Math.round(1024 / L.ar); mc.width = MW; mc.height = MH; var x = mc.getContext('2d');
      x.fillStyle = '#000'; x.fillRect(0, 0, MW, MH); x.filter = 'blur(' + Math.max(1, F * MH * .004) + 'px)'; x.fillStyle = '#fff';
      [EYE_L, EYE_R].forEach(function (E) { x.beginPath(); E.forEach(function (n, q) { var p = Lm[n]; q ? x.lineTo(p[0] * MW, p[1] * MH) : x.moveTo(p[0] * MW, p[1] * MH); }); x.closePath(); x.fill(); });
      setTex(maskTex, 1, mc); L.hasMask = 1;
      var ir = Lm.length > 470 ? Math.hypot(Lm[469][0] - Lm[471][0], (Lm[469][1] - Lm[471][1]) / L.ar) / 2 : F / L.ar * .035;
      L.iris = ir;
      // how much each grid point belongs to the face: 1 inside the face outline, fading to 0 just
      // outside it, so hair, neck and background never get pulled along
      var poly = OVAL.map(X), feather = F * .09;
      faceW = new Float32Array(NV);
      for (var k = 0; k < NV; k++) {
        var vx = base[k * 2] * L.ar, vy = base[k * 2 + 1], inside = false, dmin = 1e9;
        for (var a = 0, b = poly.length - 1; a < poly.length; b = a++) {
          var xa = poly[a][0], ya = poly[a][1], xb = poly[b][0], yb = poly[b][1];
          if (((ya > vy) !== (yb > vy)) && (vx < (xb - xa) * (vy - ya) / (yb - ya) + xa)) inside = !inside;
          var ex = xb - xa, ey = yb - ya, t = Math.max(0, Math.min(1, ((vx - xa) * ex + (vy - ya) * ey) / (ex * ex + ey * ey))), qx = xa + ex * t - vx, qy = ya + ey * t - vy;
          dmin = Math.min(dmin, Math.hypot(qx, qy));
        }
        var w = inside ? Math.min(1, .55 + dmin / feather * .45) : Math.max(0, 1 - dmin / feather) * .55;
        faceW[k] = w * w * (3 - 2 * w);
      }
    }

    var g = function (vx, vy, p, s) { var dx = vx - p[0], dy = vy - p[1]; return Math.exp(-(dx * dx + dy * dy) / (2 * s * s)); };
    // scene details for the paintings without a readable face
    var SKY = { swirls: [[.47, .33, .16, 1], [.68, .42, .1, -1]], moon: [.88, .18, .09], stars: [[.12, .07], [.24, .18], [.33, .33], [.36, .52], [.70, .23], [.61, .10], [.06, .45], [.14, .47], [.42, .08], [.33, .05], [.24, .05]], cypress: [.27, .12, .14] };
    function deform() {
      var up = Math.max(0, L.mood), dn = Math.max(0, -L.mood), lx = L.look[0], ly = L.look[1], px = L.par[0], py = L.par[1];
      var ar = L.ar, t = (performance.now() - T0) / 1000;
      var hasFace = !!L.P && mode === 'face';
      var th = up * .02 - dn * .025, cs = Math.cos(th), sn = Math.sin(th);
      for (var k = 0; k < NV; k++) {
        var vx = base[k * 2] * ar, vy = base[k * 2 + 1], dx = 0, dy = 0;
        // depth: the subject sits a little in front of the background (kept small so nothing stretches)
        var fx = (vx / ar - fig[0]) / fig[2], fy = (vy - fig[1]) / fig[3], wf = Math.exp(-(fx * fx + fy * fy) * 1.2);
        dx += px * (.003 + wf * .009) * ar; dy += py * (.003 + wf * .007);
        if (hasFace && faceW && faceW[k] > .002) {
          var w = faceW[k];
          // head: a small turn toward you, and a tilt with the mood, pivoting at the chin
          dx += (lx * F * .018 + lx * F * .012 * g(vx, vy, C.nose, F * .16)) * w; dy += ly * F * .012 * w;
          var rx = vx - C.chin[0], ry = vy - C.chin[1]; dx += (rx * cs - ry * sn - rx) * w; dy += (rx * sn + ry * cs - ry) * w + dn * F * .01 * w;
          // mouth corners, cheeks, lids, brows
          var s1 = F * .065, wl = g(vx, vy, C.mL, s1), wr = g(vx, vy, C.mR, s1);
          dy += (-.045 * up + .035 * dn) * F * (wl + wr) * w; dx += ((-.02 * up + .006 * dn) * F * wl + (.02 * up - .006 * dn) * F * wr) * w;
          dy += (-.008 * up + .006 * dn) * F * (g(vx, vy, C.lipU, F * .045) + g(vx, vy, C.lipD, F * .045) * .6) * w;
          dy += -.02 * up * F * (g(vx, vy, C.chL, F * .1) + g(vx, vy, C.chR, F * .1)) * w;
          dy += -.008 * up * F * (g(vx, vy, C.lidL, F * .028) + g(vx, vy, C.lidR, F * .028)) * w;
          var bs = F * .045, bo = g(vx, vy, C.bOutL, bs) + g(vx, vy, C.bOutR, bs), bm = g(vx, vy, C.bMidL, bs) + g(vx, vy, C.bMidR, bs);
          var biL = g(vx, vy, C.bInL, bs), biR = g(vx, vy, C.bInR, bs);
          dy += (-.012 * up * (bo + bm + biL + biR) + .012 * dn * bm + .022 * dn * (biL + biR)) * F * w;
          dx += (.012 * dn * biL * Math.sign(C.nose[0] - C.bInL[0]) + .012 * dn * biR * Math.sign(C.nose[0] - C.bInR[0])) * F * w;
        }
        if (mode === 'sky') {
          // happy: the swirls turn, the stars pulse, the moon swells, the cypress sways.
          // sad: the sky slows and sags, the stars shrink back, the cypress droops.
          var ux = vx / ar, spin = up * (.32 + .18 * Math.sin(t * 1.1)) - dn * .18;
          SKY.swirls.forEach(function (sw) { var ddx = (ux - sw[0]) * ar, ddy = vy - sw[1], r = Math.hypot(ddx, ddy), f = Math.exp(-(r * r) / (2 * sw[2] * sw[2]));
            var a2 = spin * sw[3] * f * .6, c2 = Math.cos(a2) - 1, s2 = Math.sin(a2); dx += ddx * c2 - ddy * s2; dy += ddx * s2 + ddy * c2; });
          var pulse = up * (.5 + .5 * Math.sin(t * 3.1)) - dn * .6;
          SKY.stars.forEach(function (st, i) { var ddx = (ux - st[0]) * ar, ddy = vy - st[1], f = Math.exp(-(ddx * ddx + ddy * ddy) / (2 * .035 * .035)), ph = up * (.5 + .5 * Math.sin(t * 3 + i * 1.7)) - dn * .6;
            dx += ddx * ph * .35 * f; dy += ddy * ph * .35 * f; });
          var mm = SKY.moon, mdx = (ux - mm[0]) * ar, mdy = vy - mm[1], mf = Math.exp(-(mdx * mdx + mdy * mdy) / (2 * mm[2] * mm[2]));
          dx += mdx * (up * .12 - dn * .08) * mf; dy += mdy * (up * .12 - dn * .08) * mf;
          var cy = SKY.cypress, cw = Math.exp(-Math.pow((ux - cy[0]) / cy[2], 2)), hgt = Math.max(0, 1 - vy);
          dx += cw * hgt * hgt * (up * .025 * Math.sin(t * 1.6) + dn * .03) * ar; dy += cw * hgt * hgt * dn * .02;
          dy += dn * .012 * Math.max(0, .65 - vy);
          var dz = up * .02; dx += (vx - ar / 2) * dz; dy += (vy - .5) * dz;
        } else if (mode === 'water') {
          // happy: the river ripples and the boat bobs on it, drifting toward you.
          // sad: the water goes still and the boat lists and settles lower.
          var ux2 = vx / ar, wet = Math.max(0, Math.min(1, (vy - .55) / .2));
          dy += wet * (up * .006 * Math.sin(ux2 * 26 - t * 2.4) + up * .003 * Math.sin(ux2 * 61 + t * 3.3));
          var bx = ux2 - .46, by = vy - .7, boat = Math.exp(-(bx * bx / (.3 * .3) + by * by / (.22 * .22)));
          var tilt = up * .012 * Math.sin(t * 1.3) + dn * .03, cb = Math.cos(tilt) - 1, sb = Math.sin(tilt);
          var rbx = bx * ar, rby = by; dx += (rbx * cb - rby * sb) * boat; dy += (rbx * sb + rby * cb) * boat + boat * (dn * .012 - up * .004 * (1 + Math.sin(t * 1.3)));
          var dz2 = up * .02; dx += (vx - ar / 2) * dz2; dy += (vy - .5) * dz2;
        }
        var bu = base[k * 2], bv = base[k * 2 + 1], edge = Math.min(1, Math.min(bu, 1 - bu, bv, 1 - bv) / .06); edge = edge * edge * (3 - 2 * edge);
        pos[k * 2] = bu + dx / ar * edge; pos[k * 2 + 1] = bv + dy * edge;
      }
    }

    L.step = function (now) {
      if (!L.ready) return false; var r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return false;
      var dt = Math.min(.05, (now - (L.last || now)) / 1000) || .016; L.last = now;
      // gaze: from the eyes toward the pointer; parallax: from the painting's middle
      var e = L.P ? [(L.P(468)[0] + L.P(473)[0]) / 2 / L.ar, (L.P(468)[1] + L.P(473)[1]) / 2] : [.5, .4];
      var ex = r.left + e[0] * r.width, ey = r.top + e[1] * r.height, dx = mouse.x - ex, dy = mouse.y - ey, dd = Math.hypot(dx, dy) || 1, kk = Math.min(1, dd / 360);
      var tl = [dx / dd * kk, dy / dd * kk], tp = [(mouse.x - (r.left + r.width / 2)) / innerWidth, (mouse.y - (r.top + r.height / 2)) / innerHeight];
      var moving = false, ease = function (a, b, rate) { var n = a + (b - a) * (1 - Math.exp(-rate * dt)); if (Math.abs(b - n) > .0015) moving = true; return n; };
      L.look = [ease(L.look[0], tl[0], 9), ease(L.look[1], tl[1], 9)]; L.par = [ease(L.par[0], tp[0], 5), ease(L.par[1], tp[1], 5)]; L.mood = ease(L.mood, L.moodT, 4);
      if (still) { L.look = [0, 0]; L.par = [0, 0]; }
      deform(); gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
      gl.uniform2f(U('uLook'), L.look[0], L.look[1]); gl.uniform1f(U('uIris'), L.iris); gl.uniform1f(U('uAR'), L.ar); gl.uniform1f(U('uHasMask'), L.hasMask);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      return moving || (mode !== 'face' && Math.abs(L.mood) > .01);
    };

    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () {
      L.ar = im.naturalWidth / im.naturalHeight; setTex(tex, 0, im); setTex(maskTex, 1, (function () { var c = document.createElement('canvas'); c.width = c.height = 2; return c; })());
      L.ready = true; L.size(); kick();
      if (key && mode === 'face') findFace(im, key).then(function (Lm) { if (Lm) { prepare(Lm); kick(); } });
    };
    im.src = url;
    all.push(L); return L;
  };
})();
