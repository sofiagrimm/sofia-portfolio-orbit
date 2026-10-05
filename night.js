// night.js — puts a page into the Notes / Sofia-is style: the night sky (sky.js), the handwritten
// ./menu, and pink sticker titles. Pages add their own small tweaks in CSS under body.night.
(function () {
  var here = document.currentScript && document.currentScript.src || '';
  var root = here.replace(/[^/]*$/, '');
  document.body.classList.add('night');
  if (!document.querySelector('link[href$="night.css"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = root + 'night.css'; document.head.appendChild(l); }
  // fonts the look needs
  if (!document.querySelector('link[href*="Reenie+Beanie"]') || !document.querySelector('link[href*="DM+Serif+Display"]')) {
    var f = document.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@1&family=Reenie+Beanie&display=swap'; document.head.appendChild(f);
  }
  // the sky itself (stars, constellations, clouds and grass) unless the page already draws one
  if (!document.querySelector('script[src$="sky.js"]') && !document.body.hasAttribute('data-own-sky')) { var s = document.createElement('script'); s.src = root + 'sky.js'; document.body.appendChild(s); }
  // the menu: ./home ./about ... in pen
  var links = document.querySelectorAll('nav[aria-label="Site"] a, .nav-links a');
  for (var i = 0; i < links.length; i++) {
    var a = links[i], t = a.textContent.trim().toLowerCase().replace(/&/g, 'and').replace(/\s+/g, a.textContent.trim().toLowerCase() === 'sofia is' ? '-' : '');
    if (t.indexOf('./') !== 0) a.textContent = './' + t;
  }
  // titles that should be stickers
  (document.body.getAttribute('data-stickers') || '').split(',').forEach(function (sel) { sel = sel.trim(); if (!sel) return; document.querySelectorAll(sel).forEach(function (e) { e.classList.add('sticker'); }); });
})();
