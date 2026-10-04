// On phones the 14-link menu wrapped to four or five lines and pushed every page down.
// Below 760px it folds into one "menu" button that opens a sheet with the same links.
(function () {
  var links = document.querySelector('nav[aria-label="Site"], .nav-links');
  if (!links) return;
  var css = document.createElement('style');
  css.textContent =
    '.sgm-btn{display:none;font:600 12px/1 Inter,Helvetica,Arial,sans-serif;letter-spacing:.06em;color:#2b2724;background:rgba(251,248,242,.92);' +
    'border:1.5px solid rgba(43,39,36,.25);border-radius:999px;padding:9px 14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.12)}' +
    '.sgm-btn:focus-visible{outline:3px solid #e97fae;outline-offset:2px}' +
    '.sgm-sheet{position:fixed;inset:0;z-index:1000;display:none;background:rgba(20,16,14,.42);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}' +
    '.sgm-sheet.open{display:block}' +
    '.sgm-panel{position:absolute;top:10px;right:10px;left:10px;max-height:calc(100% - 20px);overflow:auto;background:#fbf8f2;border-radius:18px;padding:14px 10px 10px;box-shadow:0 20px 50px rgba(0,0,0,.3)}' +
    '.sgm-panel a{display:block;font:500 17px/1.2 Inter,Helvetica,Arial,sans-serif;color:#2b2724;text-decoration:none;padding:12px 14px;border-radius:10px}' +
    '.sgm-panel a[aria-current],.sgm-panel a.active{background:#f6dbe6}' +
    '.sgm-panel a:focus-visible,.sgm-panel a:hover{background:#efe8dc;outline:none}' +
    '.sgm-close{float:right;font:600 12px Inter,sans-serif;background:none;border:0;color:#6b625b;padding:8px 10px;cursor:pointer}' +
    '@media (max-width:760px){.sgm-hide{display:none !important}.sgm-btn{display:inline-block}}' +
    // immersive pages (the pool hall) ask for the folded menu at every size: <body data-menu="compact">
    '.sgm-always .sgm-hide{display:none !important}.sgm-always .sgm-btn{display:inline-block}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'sgm-btn'; btn.textContent = 'menu';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-haspopup', 'dialog');
  links.parentNode.insertBefore(btn, links.nextSibling);
  links.classList.add('sgm-hide');
  if (document.body.dataset.menu === 'compact') document.documentElement.classList.add('sgm-always');

  var sheet = document.createElement('div');
  sheet.className = 'sgm-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Site menu');
  var panel = document.createElement('div'); panel.className = 'sgm-panel';
  var close = document.createElement('button'); close.type = 'button'; close.className = 'sgm-close'; close.textContent = 'close';
  panel.appendChild(close);
  Array.prototype.forEach.call(links.querySelectorAll('a'), function (a) {
    var c = document.createElement('a'); c.href = a.getAttribute('href');
    c.textContent = a.textContent.replace(/^\.\//, '').replace(/^./, function (m) { return m.toUpperCase(); });
    if (a.getAttribute('aria-current') || a.classList.contains('active')) c.setAttribute('aria-current', 'page');
    panel.appendChild(c);
  });
  sheet.appendChild(panel); document.body.appendChild(sheet);

  function open() { sheet.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); (panel.querySelector('[aria-current]') || panel.querySelector('a')).focus(); }
  function shut() { sheet.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  btn.addEventListener('click', open);
  close.addEventListener('click', shut);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) shut(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('open')) shut(); });
})();
