// Click any link with data-gh to see Sofia's GitHub profile card (the live README image) in a terminal window.
// The image comes straight from her profile repo, so the stats stay as fresh as GitHub's.
(function () {
  var SRC = 'https://raw.githubusercontent.com/sofiagrimm/sofiagrimm/main/profile.svg';
  var URL = 'https://github.com/sofiagrimm';
  var css = `
    .gh-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;
      background:rgba(3,6,14,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;transition:opacity .25s}
    .gh-overlay.on{opacity:1}
    .gh-win{width:min(1000px,100%);max-height:92vh;display:flex;flex-direction:column;background:#000;border:1px solid #30363d;border-radius:10px;
      box-shadow:0 30px 80px rgba(0,0,0,.7);transform:translateY(14px) scale(.98);transition:transform .3s cubic-bezier(.2,.8,.2,1);overflow:hidden}
    .gh-overlay.on .gh-win{transform:none}
    .gh-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#161b22;border-bottom:1px solid #30363d;
      font:13px Inter,Helvetica,Arial,sans-serif;color:#8b949e}
    .gh-dot{width:12px;height:12px;border-radius:50%;border:0;padding:0}
    .gh-dot.r{background:#ff5f57;cursor:pointer}.gh-dot.y{background:#febc2e}.gh-dot.g{background:#28c840}
    .gh-title{flex:1;text-align:center;margin-right:48px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gh-body{overflow:auto;-webkit-overflow-scrolling:touch}
    .gh-body img{display:block;width:100%;min-width:640px;height:auto;background:#000}
    .gh-body .gh-wait{padding:40px;text-align:center;font:14px Inter,Helvetica,Arial,sans-serif;color:#3fb950}
    .gh-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;background:#0d1117;border-top:1px solid #30363d;
      font:13px Inter,Helvetica,Arial,sans-serif;color:#8b949e}
    .gh-foot a{color:#58a6ff;text-decoration:none}.gh-foot a:hover,.gh-foot a:focus-visible{text-decoration:underline}
    .gh-close{background:none;border:1px solid #30363d;color:#c9d1d9;border-radius:6px;padding:4px 10px;font:inherit;cursor:pointer}
    .gh-close:hover,.gh-close:focus-visible{border-color:#8b949e;outline:none}
    @media (prefers-reduced-motion:reduce){.gh-overlay,.gh-win{transition:none}}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var overlay, lastFocus;
  function build() {
    overlay = document.createElement('div');
    overlay.className = 'gh-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Sofia Grimm on GitHub');
    overlay.innerHTML =
      '<div class="gh-win">' +
        '<div class="gh-bar"><button class="gh-dot r" aria-label="Close"></button><span class="gh-dot y"></span><span class="gh-dot g"></span>' +
        '<span class="gh-title">sofia@grimm: ~/README.md</span></div>' +
        '<div class="gh-body"><p class="gh-wait">loading sofia@grimm…</p></div>' +
        '<div class="gh-foot"><a href="' + URL + '" target="_blank" rel="noopener noreferrer">open github.com/sofiagrimm</a><button class="gh-close">close</button></div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.gh-dot.r').addEventListener('click', close);
    overlay.querySelector('.gh-close').addEventListener('click', close);
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside the window
        var f = overlay.querySelectorAll('button,a'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function open(e) {
    e.preventDefault();
    lastFocus = document.activeElement;
    if (!overlay) build();
    var body = overlay.querySelector('.gh-body');
    if (!body.querySelector('img')) {
      var img = new Image();
      img.alt = 'Sofia Grimm\u2019s GitHub profile: an ASCII portrait next to a terminal-style summary of her studies, languages, research and GitHub stats.';
      img.onload = function () { body.innerHTML = ''; body.appendChild(img); };
      img.onerror = function () { body.innerHTML = '<p class="gh-wait">couldn\u2019t load the profile. <a style="color:#58a6ff" href="' + URL + '">see it on GitHub</a></p>'; };
      img.src = SRC + '?t=' + new Date().toISOString().slice(0, 10);
    }
    overlay.style.display = 'flex';
    requestAnimationFrame(function () { overlay.classList.add('on'); });
    overlay.querySelector('.gh-close').focus();
    document.documentElement.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('on');
    document.documentElement.style.overflow = '';
    setTimeout(function () { overlay.style.display = 'none'; }, 250);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-gh]');
    if (a) open(e);
  });
})();
